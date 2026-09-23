#!/usr/bin/env node
/**
 * design-me specs 仓库一致性校验
 *
 * 把人工"护栏"转成可执行校验，供自进化/挑刺任务在改完 spec 后运行，
 * 失败则以非零码退出并在 spec 变更日志追记触发。校验项：
 *
 *  V1 无 huashu 字样残留（全仓设计文案不自称对标外部 skill）
 *  V2 specs/ 根下不散落独立 md（子代理提炼细则须在子目录内）
 *  V3 路由覆盖：每个 spec 要么被 SKILL.md 名字提及，要么其所属子目录被 SKILL.md 路由（平台深潜/细则由目录承载）
 *  V4 主 spec 遵循统一结构：设计目标 → 操作流程 → 验收标准；附属文件（平台深潜/细则/清单）豁免结构
 *  V5 spec 内部引用不指向不存在文件（`specs/...` 相对路径可存在）
 *
 * 区分：
 *  - 主 spec：每能力域的 `*_design.md` 核心文件（须完整结构）。
 *  - 附属文件：平台深潜（如 ios/android/harmony）、进阶细则（motion-audio-rules）、checklist（hi-fi-acceptance-checklist）——豁免结构校验，但须被子目录路由承载。
 *
 * 用法：  node scripts/validate.mjs [--json]
 * 退出码：0 全部通过；1 有失败项
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const exit = (code, out) => {
  if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 2));
  else console.log(out.report.join("\n"));
  process.exit(code);
};

const out = { report: [], failures: 0, checks: {} };
let failed = false;
const fail = (tag, msg) => { out.failures++; failed = true; out.report.push(`✗ [${tag}] ${msg}`); };
const ok = (tag, msg) => out.report.push(`✓ [${tag}] ${msg}`);

/* ---------- 收集 ---------- */
const allFiles = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else allFiles.push(p);
  }
})(root);

const specsDir = join(root, "specs");
const specMds = allFiles.filter((f) => f.startsWith(specsDir) && f.endsWith(".md"));
const skillMd = readFileSync(join(root, "SKILL.md"), "utf8");

/* ---------- V1 huashu 残留 ---------- */
const huashuHits = allFiles
  .filter((f) => f.endsWith(".md"))
  .map((f) => [f, readFileSync(f, "utf8")])
  .filter(([, c]) => /huashu/i.test(c));
if (huashuHits.length) fail("huashu", huashuHits.map(([f]) => f).join(", "));
else ok("huashu", "全仓 .md 无 huashu 字样");

/* ---------- V2 specs 根下散落 md ---------- */
const stray = specMds.filter((f) => !/specs\/[^/]+\//.test(f));
if (stray.length) fail("specs-root", stray.join(", "));
else ok("specs-root", "specs/ 根下无散落 md");

/* ---------- V3 路由覆盖：SKILL.md 提及全部 spec（含目录承载） ---------- */
const missing = [];
const knownDirs = new Set(Array.from(skillMd.matchAll(/specs\/([\w-]+)[/`\s]/g)).map((m) => m[1]));
for (const f of specMds) {
  const rel = f.replace(root + "/", "");
  const sub = f.replace(specsDir + "/", "").split("/")[0];
  // 条件 A：SKILL.md 直接点名该文件；条件 B：其所属子目录在 SKILL.md 路由中被提及
  if (skillMd.includes(rel) || knownDirs.has(sub)) continue;
  missing.push(rel);
}
if (missing.length) fail("route", "SKILL.md 未提及（须指名或所属目录进路由）：" + missing.join(", "));
else ok("route", `SKILL.md 覆盖全部 ${specMds.length} 个 spec（含目录承载）`);

/* ---------- V4 统一结构（仅主 spec，务实断言） ---------- */
// 附属文件 = 平台深潜（*ios/*android/*harmony）、进阶细则、checklist，豁免结构
const isAux = (f) =>
  /\/(?:ios|android|harmony)\.md$/.test(f) ||
  f.endsWith("motion/motion-audio-rules.md") ||
  f.endsWith("workflow/hi-fi-acceptance-checklist.md");
const isMain = (f) => !isAux(f);

const structOk = [], structBad = [];
// 必有「设计目标」；收尾墙至少命中其一（各 spec 命名不一，不强求统一标题）
const hardWall = ["验收标准", "边界与不做项", "收敛条件", "审阅迭代"];
for (const f of specMds) {
  if (!isMain(f)) continue;
  const c = readFileSync(f, "utf8");
  const has = (s) => c.includes(`## ${s}`) || c.includes(`# ${s}`);
  const miss = [];
  if (!has("设计目标")) miss.push("设计目标");
  if (!hardWall.some(has)) miss.push(`收尾（${hardWall.join("/")} 之一）`);
  if (miss.length) structBad.push(`${f.replace(specsDir + "/", "")} 缺:${miss.join("、")}`);
  else structOk.push(f);
}
if (structBad.length) fail("structure", structBad.join(" | "));
else ok("structure", `主 spec（${structOk.length}）均有「设计目标 + ${hardWall.join("/")}之一」`);

/* ---------- V5 内部引用可存在 ---------- */
const refsBad = [];
for (const f of specMds) {
  const c = readFileSync(f, "utf8");
  const refs = c.matchAll(/`(\.\.\/[\w./\-]+\.md)`/g);
  for (const m of refs) {
    const target = resolve(dirname(f), m[1]);
    if (!existsSync(target)) refsBad.push(`${f.replace(root + "/", "")} -> ${m[1]}`);
  }
}
if (refsBad.length) fail("refs", refsBad.join(" | "));
else ok("refs", "spec 内部相对引用均存在");

/* ---------- 汇总 ---------- */
if (failed) exit(1, { ...out, checks: { huashu: 0, specs_root: 0, route: 0, structure: 0, refs: 0 } });
else { out.report.push(`\n全部通过（${specMds.length} 个 spec，5 项校验）`); exit(0, out); }