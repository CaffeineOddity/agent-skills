---
name: design-me
description: 跨端设计能力中心，覆盖设计研究与竞品分析、Web 界面设计、移动端（iOS/Android/鸿蒙）设计、品牌视觉系统设计、内容封面设计（公众号/小红书/YouTube/B站/Bilibili）、设计系统与 Token、动效系统、插画系统与文章配图、图标系统、内容设计与 UI 文案、设计交付与走查、低保真线框图与审阅反馈迭代、设计流程编排（PRD 到交付全流程）、设计规范定制，以及 toapis 图像/视频生成前的 Prompt 撰写（xxx_prompt.md）。当用户需要做竞品分析、moodboard、设计页面、组件、品牌 Logo、品牌色彩体系、启动图、UI 图标、封面头图缩略图、设计 Token、动效、空状态插画、空状态文案、文章内文配图、按钮文案错误提示、标注切图交付走查、低保真线框图、页面走查审阅反馈收集、图像生成提示词（xxx_prompt.md）、or 需要定制/覆盖设计规范时使用此 Skill。涉及任何「看起来怎样、用起来怎样、品牌表达怎样、动起来怎样、文案怎么写」的设计决策都应触发此 Skill，即使用户没有明确说「设计」二字。
---

# Design - 跨端设计能力中心

一站式设计 Skill。设计能力按领域分层，每个领域有独立 spec 作为该领域的唯一事实来源（single source of truth）。本文件负责需求分流与流程编排，具体规范、操作流程与验收标准在各 spec 中。

遵循项目 SDD 规则：spec 与产出始终一致，spec 是活文档，先改 spec 再改产出。

## 何时使用

| 场景 | 触发示例 | 路由到 |
|------|---------|--------|
| Web 页面/组件设计 | 「设计一个落地页」「做个数据仪表盘」 | specs/web |
| 移动端界面设计 | 「设计 iOS 首页」「做个 Android 商品卡」 | specs/mobile |
| 品牌视觉系统 | 「设计品牌 Logo」「出一套品牌色彩体系」 | specs/brand |
| 启动图/图标/切图 | 「生成启动图」「出 iOS 图标集」 | specs/mobile |
| 内容封面/头图 | 「做公众号头图」「出一套小红书封面」「YouTube 缩略图」 | specs/cover |
| 设计系统/Token | 「建一套设计 Token」「定义组件库」「色彩体系怎么用」 | specs/design-system |
| 动效/动画 | 「定义动效规范」「页面转场怎么做」「加载动画」 | specs/motion |
| 插画/空状态 | 「设计空状态插画」「出引导页插画」「错误页插画」 | specs/illustration |
| 图标系统 | 「出一套 UI 图标」「图标线宽怎么定」「图标命名」 | specs/icon-system |
| 内容设计/文案 | 「按钮文案怎么写」「错误提示文案」「空状态文案」 | specs/content |
| 设计研究/竞品 | 「竞品分析」「设计研究」「moodboard」「找参考」 | specs/research |
| 标注/切图/交付 | 「出标注文档」「交付给开发」「走查清单」 | specs/handoff |
| 页面描述/低保真 | 「出页面描述」「写页面描述文档」「出低保真线框」「画线框图」「信息架构」 | specs/workflow |
| 页面走查/审阅 | 「页面走查」「审查页面」「低保真审阅」「反馈收集」 | specs/review |
| 设计流程编排 | 「从 PRD 到设计」「完整设计流程」「设计到交付流程」 | specs/workflow |
| 规范定制/覆盖 | 「定制项目设计规范」「覆盖默认色彩」 | specs/spec-customization |
| 跨端一致性 | 「Web 和移动端风格统一」 | 先 specs/brand，再 specs/web + specs/mobile |

**判断准则**：任务会改变产品「看起来怎样、用起来怎样、品牌表达怎样」 -> 使用此 Skill。

## 能力总览

```
design/
├── SKILL.md                    ← 你在这里：流程编排与路由
├── scripts/
│   └── toapis.py               ← AI 图像/视频生成封装（接入 ToAPIs）
├── config/
│   └── .env                    ← API Key 配置（不上传，见 .gitignore）
└── specs/
    ├── web/                    ← Web 界面设计规范
    │   └── web-design.md
    ├── mobile/                 ← 移动端设计规范（跨端共用 + 平台深潜）
    │   ├── mobile-design.md
    │   ├── ios.md              ← iOS 平台深潜（Apple HIG）
    │   ├── android.md          ← Android 平台深潜（Material 3）
    │   └── harmony.md          ← 鸿蒙平台深潜（HarmonyOS UX）
    ├── brand/                  ← 品牌视觉系统设计规范
    │   └── brand-design.md
    ├── cover/                  ← 内容封面设计规范（公众号/小红书/YouTube/B站等）
    │   └── cover-design.md
    ├── design-system/          ← 设计系统（Token 架构 + 组件库 + 模式）
    │   └── design-system.md
    ├── motion/                 ← 动效系统（跨端统一动效语言）
    │   └── motion-design.md
    ├── illustration/           ← 插画系统（空状态/引导/错误/加载/文章配图）
    │   └── illustration-design.md
    ├── icon-system/            ← 图标系统（跨端设计基线 + 平台深潜）
    │   ├── icon-system-design.md
    │   ├── web.md              ← Web 图标实现（SVG/CSS/currentColor）
    │   ├── ios.md              ← iOS 图标实现（SF Symbols/Asset Catalog）
    │   ├── android.md          ← Android 图标实现（Vector Drawable/密度目录）
    │   └── harmony.md          ← 鸿蒙图标实现（$r 资源引用）
    ├── image-prompt/           ← toapis 生成前的 Prompt 撰写规范（xxx_prompt.md）
    │   └── image-prompt-design.md
    ├── content/                ← 内容设计（按钮文案/错误提示/空状态文案/术语表）
    │   └── content-design.md
    ├── research/              ← 设计研究（竞品分析/模式提取/moodboard）
    │   └── research-design.md
    ├── handoff/                ← 设计交付（标注/切图/Token/走查）
    │   └── handoff-design.md
    ├── workflow/               ← 设计流程编排（PRD -> 低保真 -> 品牌 -> 高保真 -> 交付）
    │   └── design-workflow.md
    ├── review/                 ← 审阅反馈机制（可审阅 HTML + 反馈收集 + 导出）
    │   └── review-design.md
    └── spec-customization/     ← 规范定制与项目级覆盖
        └── spec-customization.md
```

每个 spec 遵循统一结构：设计目标 → 操作流程 → 规范要求 → 验收标准 → 边界与不做项。

## 统一设计流程

不论路由到哪个能力，都遵循以下五步。前四步是「理解 → 加载 → 确认 → 执行」，第五步是交付前的硬性闸门。

> 若任务是从 PRD 开始的完整设计流程（研究 → 页面描述 → 低保真 → IP/设计规范 → 高保真 → 交付），先读 `specs/workflow/design-workflow.md`，那里定义了 Phase 1-6 的完整流程主线与收敛检查点。设计研究（竞品分析/moodboard）是 Phase 0，见 `specs/research`。本节五步是单次设计任务的通用流程，workflow spec 是项目级流程编排。

### 1. 需求解构

从用户请求中提取五个维度：

- **产品类型**：工具 / 社交 / 电商 / 内容 / 生产力 / 混合
- **目标用户**：C 端消费者（年龄、场景）或 B 端专业用户
- **风格关键词**：极简 / 玻璃拟态 / 暗色 / 暖色 / 科技感 / 等
- **技术约束**：框架、性能要求、无障碍等级
- **目标平台**：Web / iOS / Android / 鸿蒙 / 多端

维度缺失时主动追问，不要凭空假设。

### 2. 规范加载

按下文路由表读取对应 spec，加载该领域的设计目标、操作流程与验收标准。

若用户提及品牌一致性或跨端统一，先读 `specs/brand` 建立品牌基线（色彩、字体、风格基调），再读各端 spec。品牌 spec 是跨端一致性的锚点。

### 3. 方向确认

基于 spec 的风格指引，提出 1-2 个设计方向（含色彩基调、字体配对、风格方向），与用户确认后再执行。

方向未定时直接产出成品是最大的返工来源——先花一轮对齐方向，后续执行才有靶心。

### 4. 设计执行

按 spec 中的操作流程逐步执行。每一步产出可验证的中间件：

- 品牌层：色板、字体层级表、Logo 安全空间图
- 页面层：信息架构、线框、高保真稿
- 组件层：组件稿、状态变体、标注
- 资源层：切图包、样式 Token

中间件可被用户中途审阅，避免一路做到底才发现偏离。

### 4b. 图像/视频生成（Phase 3-5 必须执行）

Phase 3-5 须使用 `scripts/toapis.py` 生成真实素材，不得用 emoji 或 CSS 占位符替代。各 Phase 的素材生成要求见 `specs/workflow` 对应步骤。

**生成前必须先写 Prompt 文件（`xxx_prompt.md`）**：凡出设计效果图（图标、icon、UI、IP 形象、封面、插画、品牌素材等），先生成存到 `design/output/prompts/<素材类型>/` 下的 `<素材名>_prompt.md`（结构模板、品牌基线绑定、`--ref`、负面词、验收见 `specs/image-prompt/image-prompt-design.md`），审阅确认后再把该 prompt 交给 toapis 生成。禁止在命令行 `--prompt "..."` 里即兴写、跳过 prompt 文件。

```bash
# 0) 先生成 prompt 文件（顺带调 toapis 模型的正确写法）
# 写 design/output/prompts/brand/ip_base_prompt.md（结构见 specs/image-prompt），然后：
python3 scripts/toapis.py image --model gpt-image-2 --prompt "$(cat design/output/prompts/brand/ip_base_prompt.md)" --background transparent --save design/output/assets/brand/ip_base.png

# 列出可用模型
python3 scripts/toapis.py models

# 生成视频（如动效预览、品牌片头），同样先写 xxx_prompt.md
python3 scripts/toapis.py video --model veo3.1-fast --prompt "..." --aspect-ratio 16:9 --save design/output/intro.mp4

# 上传参考图后做图生图（--ref 场景，prompt 只写变体差异）
python3 scripts/toapis.py upload --file ./reference.jpg
python3 scripts/toapis.py image --model gpt-image-2 --prompt "改为赛博朋克风格" --ref https://files.toapis.com/xxx.jpg
```

素材存入 `design/output/assets/` 目录，以 `<img>` 嵌入 HTML。API Key 在 `config/.env` 配置（不上传）。生成结果 URL 有效期 24 小时，须用 `--save` 及时下载。各 spec 的验收标准仍须逐项核对，AI 生成素材不豁免验收。生成结果不理想先改 `xxx_prompt.md` 再生成，不在生成后反复改图。

Phase 2 起凡生成可审阅 HTML，保存反馈功能必须包含 FSAA 写入主路径（`showDirectoryPicker` + IndexedDB 句柄复用）+ Blob 下载降级，缺 FSAA 只做 Blob 下载视为验收不通过；生成前对照 `specs/review/review-design.md` 的「FSAA 参考实现」与验收清单。

### 5. 验收对齐

执行对应 spec 的验收清单，逐项核对。未通过项修正后再交付。验收清单是该领域的硬性闸门，不是可选建议。

## 路由表

读取 spec 时按用户意图关键词匹配。匹配到多个时，按品牌优先原则处理（先品牌基线，后各端执行）。

| 用户意图关键词 | 读取 |
|----------------|------|
| 落地页、仪表盘、后台、Web 组件、响应式、前端页面 | `specs/web/web-design.md` |
| iOS、Android、鸿蒙、App、移动端、启动图、图标、切图、安全区 | `specs/mobile/mobile-design.md` |
| Logo、品牌色、VI、视觉系统、字体层级、IP 形象、品牌手册 | `specs/brand/brand-design.md` |
| 封面、头图、缩略图、公众号、小红书、YouTube、Bilibili、视频封面 | `specs/cover/cover-design.md` |
| 设计系统、Token、组件库、组件变体、设计 Token 架构 | `specs/design-system/design-system.md` |
| 动效、动画、转场、缓动、时长、动效规范、动效 Token | `specs/motion/motion-design.md` |
| 插画、空状态、引导页插画、错误页插画、加载动画、插画风格、文章配图、内文配图、流程图解、概念图 | `specs/illustration/illustration-design.md` |
| 图标、UI 图标、图标线宽、图标网格、图标命名、图标系统、图标状态、SVG 图标 | `specs/icon-system/icon-system-design.md` |
| 生成提示词、写 prompt、图像生成 Prompt、toapis prompt、效果图 prompt、xxx_prompt.md | `specs/image-prompt/image-prompt-design.md` |
| 按钮文案、错误提示、空状态文案、表单文案、tooltip 文案、microcopy、术语表、UI 文案 | `specs/content/content-design.md` |
| 竞品分析、设计研究、moodboard、情绪板、设计参考、竞品对比、设计模式 | `specs/research/research-design.md` |
| 标注、切图、交付、走查、还原度、设计交付、设计走查 | `specs/handoff/handoff-design.md` |
| 低保真、线框图、页面描述、信息架构、PRD 到设计、设计流程、页面描述文档、页面清单、交付包 | `specs/workflow/design-workflow.md` |
| 页面走查、审阅、反馈收集、走查页面、快捷标记、反馈导出、可审阅 HTML | `specs/review/review-design.md` |
| 定制规范、覆盖规范、项目规范、设计 Token、master/override | `specs/spec-customization/spec-customization.md` |

## 跨端项目协调

当同一品牌需多端产出时（如品牌 Logo + Web 官网 + 移动端 App）：

1. 先读 `specs/brand` → 确立品牌基线（Logo、色彩、字体、辅助图形、IP）
2. 将品牌基线作为设计 Token 注入各端
3. 分别读 `specs/web` 与 `specs/mobile`，按各端平台规范执行
4. 各端产出须通过各自验收清单 + 品牌一致性复核

品牌 spec 是跨端一致性的唯一锚点。各端平台规范（如 iOS HIG、Material、Web 响应式）是各端可用性的底线。二者不矛盾：品牌定调，平台定规。

## 规范演进

spec 是活文档，遵循项目 SDD 规则：

- **新增设计能力** → 先写/更新对应 spec，再执行
- **调整设计要求** → 先改 spec，再改产出，使产出贴合更新后的 spec
- **spec 与产出矛盾** → 以 spec 为准修正产出；若 spec 本身有误则先修 spec 再改产出，二者不得长期背离

规范定制能力（`specs/spec-customization`）描述如何在不修改全局 spec 的前提下，做项目级覆盖（master + overrides 模式），适用于多项目共用同一套设计基线但各有差异的场景。
