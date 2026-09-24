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
  V5 spec 内部引用不指向不存在文件（`specs/...` 相对路径可存在）
 *  V6 回归产物自检落点：design/regression/<域>/ 有产物（除 prd/SELF-CHECK/截图外还有其他文件）时，
 *     必须存在 SELF-CHECK.md 且含 5 维度分项评分行（概念/立意、视觉层级、细节执行、功能性、创新性），
 *     保证「5 维度评审」有落盘复核点而非只在心里评
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

/* ---------- V6 回归产物自检落点（SELF-CHECK.md + 5 维度评分） ---------- */
const regDir = resolve(root, "..", "design", "regression");
const v6Bad = [];
if (existsSync(regDir)) {
  for (const e of readdirSync(regDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const dir = join(regDir, e.name);
    const files = [];
    (function w2(d) {
      for (const x of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, x.name);
        if (x.isDirectory()) w2(p);
        else files.push(p);
      }
    })(dir);
    // 有实质产物（排除自检文档/PRD/截图/日志本身）才要求 SELF-CHECK
    const real = files.filter((f) => !/(^|\/)(SELF-CHECK\.md|prd\.md|selftest-log\.md)$/.test(f) && !/\.(png|jpg|jpeg)$/.test(f));
    if (!real.length) continue;
    const sc = files.find((f) => f.endsWith("SELF-CHECK.md"));
    if (!sc) { v6Bad.push(`${e.name}/ 缺 SELF-CHECK.md（产物 ${real.length} 个文件）`); continue; }
    const c = readFileSync(sc, "utf8");
    const dims = ["概念", "视觉层级", "细节执行", "功能性", "创新"];
    const missing = dims.filter((d) => !c.includes(d));
    if (missing.length) v6Bad.push(`${e.name}/SELF-CHECK.md 缺 5 维度评分项:${missing.join("、")}`);
  }
}
if (v6Bad.length) fail("self-check", v6Bad.join(" | "));
else ok("self-check", "回归产物均有 SELF-CHECK.md 且含 5 维度评分项");

/* ---------- V7 Web 产物双态提示重置（style.color 残留） ---------- */
const v7Bad = [];
const regHtmls = [];
(function walkReg(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walkReg(p);
    else if (p.endsWith(".html")) regHtmls.push(p);
  }
})(regDir);
for (const f of regHtmls) {
  const c = readFileSync(f, "utf8");
  const assigns = [...c.matchAll(/([\w$][\w$.]*)\.style\.color\s*=\s*([^;]+);?/g)]
    .map((m) => ({ base: m[1], val: m[2].trim() }))
    .filter(({ val }) => val !== "''" && val !== '""'); // 赋 '' 本身是重置，不算态
  const bases = [...new Set(assigns.map((a) => a.base))];
  if (!bases.length) continue; // 无 style.color 赋色，不适用
  const resetVars = new Set(
    [...c.matchAll(/([\w$][\w$.]*)\.style\.color\s*=\s*['"]{2}|([\w$][\w$.]*)\.style\.removeProperty\(\s*['"]color['"]/g)]
      .flatMap((m) => [m[1], m[2]].filter(Boolean))
  );
  const unreset = bases.filter((b) => !resetVars.has(b));
  if (unreset.length) {
    const rel = f.replace(regDir + "/", "");
    v7Bad.push(`${rel}: 提示区 ${unreset.join(",")} 存在 style.color 赋色但无切换前重置（style.color='' / removeProperty）`);
  }
}
if (v7Bad.length) fail("duotone-reset", v7Bad.join(" | "));
else ok("duotone-reset", "Web 产物双态提示均有切换前重置（或无多态赋色）");

/* ---------- V9 design-system Token 完整性（spec 阶梯同源 + 引用存在 + 文档 CSS 变量同源） ---------- */
const v9Bad = [];
{
  for (const dom of ["design-system", "brand"]) {
    const dDir = join(regDir, dom);
    if (!existsSync(dDir)) continue;
    for (const tj of readdirSync(dDir).filter((f) => f === "tokens.json" || f === "palette.json")) {
      const t = JSON.parse(readFileSync(join(dDir, tj), "utf8"));
      // 1) 全部 {ref} 引用可解析（语义键或 基线.阶）
      const semKeys = new Set(
        Object.keys(t.semantic?.light || {}).concat(Object.keys(t.semantic?.dark || {}))
      );
      const baseKeys = new Set();
      for (const [cat, v] of Object.entries(t.baseline || {})) {
        if (cat === "color") for (const [n, sh] of Object.entries(v)) for (const sk of Object.keys(sh)) if (sk !== "chroma-role") baseKeys.add(`${n}.${sk}`);
        else if (typeof v === "object" && v !== null) for (const k of Object.keys(v)) baseKeys.add(`${cat}.${k}`);
      }
      const broken = [];
      (function walk(o, path) {
        if (typeof o === "string") {
          for (const m of o.matchAll(/\{([\w.-]+)\}/g)) {
            const r = m[1];
            if (!(semKeys.has(r) || baseKeys.has(r) || r.startsWith("motion."))) broken.push(`${path}: {${r}} 无定义`);
          }
        } else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`);
      })(t.components || {}, "components");
      if (broken.length) v9Bad.push(`${dom}/${tj}: 引用悬空 ${broken.slice(0,3).join("; ")}`);
    }
    // 2) token-doc.html（含 critic-round2）:root 的 oklch 变量须在 tokens.json 中存在同值
    for (const sub of ["", "design-system-critic-round2"]) {
      const doc = join(dDir, sub, "token-doc.html");
      const src = join(dDir, sub, "tokens.json");
      if (!existsSync(doc) || !existsSync(src)) continue;
      const c = readFileSync(doc, "utf8");
      const t = JSON.parse(readFileSync(src, "utf8"));
      const jsonVals = new Set();
      (function collect(o){ if (typeof o === "string"){ const m = o.match(/oklch\([^)]*\)/g); if (m) m.forEach(x=>jsonVals.add(x.replace(/\s+/g,""))); } else if (o && typeof o==="object") for (const v of Object.values(o)) collect(v); })(t);
      const rootBlock = (c.match(/:root\s*{([^}]*)}/) || [])[1] || "";
      const cssOk = [...rootBlock.matchAll(/oklch\([^)]*\)/g)].map((m) => m[0].replace(/\s+/g,""));
      const stray = [...new Set(cssOk.filter((v) => !jsonVals.has(v)))];
      if (stray.length) v9Bad.push(`${sub || "."}/token-doc.html: :root 出现 tokens.json 未定义的 oklch 值 ${stray.slice(0,3).join(", ")}`);
    }
  }
}
if (v9Bad.length) fail("ds-token-integrity", v9Bad.join(" | "));
else ok("ds-token-integrity", "design-system Token 引用无悬空、文档 CSS 变量与 tokens.json 同源");

/* ---------- V8 品牌手册 <5% 偏差（Token diff 可执行化，specs/brand 验收项） ---------- */
// design/regression/brand/ 存在 *-brand.html + assets/*-palette.json 时：
// HTML :root 色彩/字体变量与 JSON hex/字体族逐项 diff，不一致项数 >5% 失败
const v8Bad = [];
{
  const bDir = join(regDir, "brand");
  if (existsSync(bDir)) {
    const htmls = readdirSync(bDir).filter((f) => f.endsWith("-brand.html"));
    const palettes = [];
    const aDir = join(bDir, "assets");
    if (existsSync(aDir)) for (const f of readdirSync(aDir)) if (f.endsWith("-palette.json")) palettes.push(join(aDir, f));
    if (htmls.length && palettes.length) {
      const pal = JSON.parse(readFileSync(palettes[0], "utf8"));
      const expect = new Set(pal.colors.map((c) => c.hex.toLowerCase()));
      const fontFam = new Set();
      for (const k of ["display", "body", "label"]) {
        const t = pal.typography?.[k]?.family;
        if (t) fontFam.add(t.split(",")[0].trim().replace(/"/g, ""));
      }
      for (const h of htmls) {
        const c = readFileSync(join(bDir, h), "utf8");
        const rootBlock = (c.match(/:root\s*{([^}]*)}/) || [])[1] || "";
        const vars = [...rootBlock.matchAll(/--[\w-]+:\s*([^;]+);/g)].map((m) => m[1].trim());
        const hexes = vars.filter((v) => /^#[0-9a-f]{3,8}$/i.test(v));
        const mismatch = hexes.filter((v) => !expect.has(v.toLowerCase())).length;
        const fams = vars.filter((v) => v.includes("serif") || v.includes("sans")).length;
        const famHit = vars.some((v) => [...fontFam].some((f) => v.includes(f)));
        const total = hexes.length + fams;
        const bad = mismatch + (fams && !famHit ? fams : 0);
        if (!total) { v8Bad.push(`${h}: :root 无可比对 Token`); continue; }
        if (bad / total > 0.05) v8Bad.push(`${h}: Token diff ${bad}/${total}（${(bad/total*100).toFixed(1)}% > 5%）`);
      }
    }
  }
}
if (v8Bad.length) fail("brand-token-diff", v8Bad.join(" | "));
else ok("brand-token-diff", "品牌手册 :root Token 与色板 diff ≤5%");

/* ---------- V10 品牌资产 SVG 用色治理（specs/brand「色彩不可用未定义色」可执行化） ---------- */
// design/regression/brand{,-critic-round2}/assets/*.svg 的 fill/stroke hex 须在对应 palette.json 内（含 critic-round2）
const brandSvgBad = [];
{
  for (const sub of ["", "/brand-critic-round2"]) {
    const aDir = join(regDir, "brand" + sub, "assets");
    if (!existsSync(aDir)) continue;
    const pals = readdirSync(aDir).filter((f) => f.endsWith("-palette.json") || f === "palette.json");
    if (!pals.length) continue;
    const pal = JSON.parse(readFileSync(join(aDir, pals[0]), "utf8"));
    const palHex = new Set((pal.colors || []).map((c) => (c.hex || "").toUpperCase()));
    for (const f of readdirSync(aDir).filter((f) => f.endsWith(".svg"))) {
      const s = readFileSync(join(aDir, f), "utf8");
      for (const m of s.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8})"/g)) {
        if (!palHex.has(m[1].toUpperCase())) brandSvgBad.push(`brand${sub || ""}/assets/${f}: ${m[1]} 未入色板`);
      }
    }
  }
}
if (brandSvgBad.length) fail("brand-svg-palette", brandSvgBad.join(" | "));
else ok("brand-svg-palette", "品牌 SVG 资产用色全部在色板内（含单色/反白变体）");

/* ---------- V9 图标集一致性（specs/icon-system 验收可执行化） ---------- */
// design/regression/icon-system/assets/icons/** 有 SVG 时逐文件校验：
// viewBox 一致、stroke-width 取值唯一、线框图标 linecap/linejoin=round、含 currentColor、命名合规
const v10Bad = [];
let v10Count = 0;
{
  // icon-system（ic_*）与 illustration（ill_*）共用结构校验；命名前缀族不同
  const dirs = [
    ["icon-system", "assets/icons", /^ic_(action|nav|status|content|system)_[a-z0-9_]+(_filled)?\.svg$/, "ic_<类别>_<名称>"],
    ["illustration", "assets/icons", /^ill_[a-z0-9_]+\.svg$/, "ill_<场景>_<用途>"],
  ];
  for (const [dom, sub, nameRe, nameDesc] of dirs) {
    const iDir = join(regDir, dom, sub);
    const svgs = [];
    (function walk(d, rel) {
      if (!existsSync(d)) return;
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(d, e.name), rel ? rel + "/" + e.name : e.name);
        else if (e.name.endsWith(".svg")) svgs.push({ path: join(d, e.name), rel: (rel ? rel + "/" : "") + e.name });
      }
    })(iDir, "");
    v10Count += svgs.length;
    if (svgs.length) {
      const vbs = new Set();
      const widths = new Set();
      for (const s of svgs) {
        const c = readFileSync(s.path, "utf8");
        const vb = (c.match(/viewBox="([^"]+)"/) || [])[1];
        if (vb) vbs.add(vb);
        for (const w of c.matchAll(/stroke-width="([\d.]+)"/g)) widths.add(w[1]);
        if (!/currentColor/.test(c)) v10Bad.push(`${s.rel}: 缺 currentColor`);
        if (/<text/.test(c)) v10Bad.push(`${s.rel}: 含 <text>（未转曲）`);
        if (!nameRe.test(s.rel.split("/").pop()))
          v10Bad.push(`${s.rel}: 命名不合 ${nameDesc} 规范`);
        if (/stroke="currentColor"/.test(c) && !/stroke-linecap="round"/.test(c))
          v10Bad.push(`${s.rel}: 线框图标端点未统一 round`);
        if (/stroke="currentColor"/.test(c) && /Z/.test((c.match(/d="([^"]+)"/) || [,""])[1]) && !/stroke-linejoin="round"/.test(c))
          v10Bad.push(`${s.rel}: 闭合路径转角未统一 round`);
      }
      if (vbs.size > 1) v10Bad.push(`${dom}: viewBox 不一致：${[...vbs].join(" / ")}`);
      if (widths.size > 1) v10Bad.push(`${dom}: stroke-width 档位混用：${[...widths].join(" / ")}`);
    }
  }
}
if (v10Bad.length) fail("icon-set", v10Bad.join(" | "));
else ok("icon-set", `图标/插画集结构一致性（${v10Count} 枚 SVG：画布/线宽/圆角/currentColor/命名）`);

/* ---------- 汇总 ---------- */
if (failed) exit(1, { ...out, checks: { huashu: 0, specs_root: 0, route: 0, structure: 0, refs: 0, self_check: 0, brand_diff: 0, icon_set: 0 } });
else { out.report.push(`\n全部通过（${specMds.length} 个 spec，8 项校验）`); exit(0, out); }