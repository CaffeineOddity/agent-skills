# 动效系统规范

> 本文件是跨端动效设计的唯一事实来源。各端 spec（web/mobile）只补平台差异，动效原则与 Token 体系在此统一定义，消除碎片化重复。交互声音（UI SFX）与动效同属「动态质感」层，一并在此统一定义。

## 设计目标

为 Web、iOS、Android、鸿蒙各端定义统一的动效语言：时长、缓动、编排原则、状态转场、页面转场。核心是「一套动效 Token，各端各实现」--动效语言跨端一致，各端按平台能力适配。

动效的设计目的不是炫技，是**传达因果关系与空间层次**。每个动效须能回答「它在告诉用户什么」--是状态变化、是页面跳转、是内容加载、还是层级展开。无因果的装饰动效是噪音。

交互动效之外，还需保障**视觉档次与声音质感**：动效不是可用功能，也是产品「动态温度」的载体。边看边动、动若有声，才让产品有完成度。本条是完成度的质量闸门，不是可选项。

## 动效原则

| 原则 | 说明 |
|------|------|
| 因果优先 | 动效传达因果关系，非纯装饰。用户须能从动效理解「发生了什么」 |
| 自然物理 | 用物理曲线（弹簧/惯性），不用线性。物体减速比匀速更自然 |
| 层次表达 | 入场从下方/前方 = 更深层级；退场向下方/后方 = 返回浅层 |
| 可中断 | 动效进行中用户操作须立即响应，动画可被中断重置 |
| 不阻塞 | 动效期间 UI 保持可交互，不锁定输入 |
| 降级尊重 | 尊重 `prefers-reduced-motion` / 系统减弱动效设置，降级为淡入淡出 |

## Token 体系

### 时长 Token

| Token | 值 | 用途 |
|-------|----|------|
| duration-instant | 0ms | 即时反馈，无动画（禁用动效降级时使用） |
| duration-fast | 100-150ms | 微交互：按钮按压、开关切换、选中态 |
| duration-normal | 200-300ms | 常规转场：模态展开、列表项展开、抽屉滑出 |
| duration-slow | 300-400ms | 复杂转场：页面切换、多元素编排 |
| duration-slower | 400-500ms | 全屏转场、大型内容替换（上限） |

- 禁超 500ms，超过则用户感知为卡顿
- 退场比入场快约 60-70%（退场是确认已完成的操作，不需拖沓）
- 列表错峰入场 30-50ms/项

### 缓动 Token

| Token | 曲线 | 用途 |
|-------|------|------|
| easing-enter | cubic-bezier(0, 0, 0.2, 1) | 入场：元素出现，快速开始缓慢结束 |
| easing-exit | cubic-bezier(0.4, 0, 1, 1) | 退场：元素消失，缓慢开始快速结束 |
| easing-standard | cubic-bezier(0.4, 0, 0.2, 1) | 对称转场：状态切换、模态移动 |
| easing-spring | spring(1, 100, 10, 0) | 物理感交互：拖拽回弹、卡片缩放 |

- 禁用 `linear`，匀速动效不自然
- iOS 优先弹簧曲线（spring physics），Android 用 Material Motion 曲线
- 缓动 Token 各端实现方式不同，但曲线语义一致

### 属性 Token

| Token | 说明 |
|-------|------|
| property-transform | 只动 transform/opacity，不动 width/height/top/left |
| property-scale | 缩放反馈 0.95-1.05，按压缩小释放回弹 |
| property-translate | 位移用于入场/退场方向表达 |

## 编排规则

### 状态转场

状态变化（hover/active/expanded/collapsed/modal-open）须平滑过渡，不硬切：

- 按压：scale 0.95-1.05 + 透明度变化，duration-fast
- 选中：背景色淡入 + 边框变化，duration-normal
- 展开：高度/透明度 + 子元素错峰入场
- 模态：从触发源 scale+fade 入场，背板 fade 入场

### 页面转场

| 方向 | 动效 | 语义 |
|------|------|------|
| 前进导航 | 从右侧滑入 / 从底部升起 | 进入更深层级 |
| 后退导航 | 向右滑出 / 向下降落 | 返回浅层 |
| 模态弹出 | 从触发源 scale+fade 或从底部升起 | 临时任务层 |
| 模态关闭 | 缩回触发源 或下滑消失 | 返回原位 |
| 内容替换 | 交叉淡入淡出 | 同层内容切换 |

- 前进用 ease-out（快速进入后减速）
- 后退用 ease-in（缓慢开始后加速离开）
- 共享元素转场：前后页面共享的元素做位移动画，保持视觉连续

### 加载动效

| 场景 | 动效 |
|------|------|
| < 300ms | 不显示加载动效（用户感知不到） |
| 300ms-1s | 骨架屏 / 微光闪烁 |
| > 1s | 进度条 / 明确进度指示 |

- 骨架屏形状须与最终内容轮廓一致，减少布局跳动
- 禁用长时间阻塞式转圈（spinner），用骨架屏或渐进式加载

### 滚动与手势

- 拖拽须实时跟随手指，无延迟（手势反馈 = 手势位移）
- 滚动减速用物理惯性曲线
- 下拉刷新：阻尼随下拉距离增大，松手回弹或触发刷新
- 视差效果克制使用，尊重 reduced-motion，不致眩晕

## 各端差异补充

动效 Token 在各端的实现差异：

| 维度 | Web | iOS | Android | 鸿蒙 |
|------|-----|-----|---------|------|
| 物理曲线 | CSS transition + cubic-bezier | UIKit spring / SwiftUI spring | Material Motion / spring | 鸿蒙动画框架 |
| reduced-motion | `prefers-reduced-motion` | `UIAccessibility.isReduceMotionEnabled` | `Animator.areAllAnimatorsDisabled()` | 系统减弱动效设置 |
| 页面转场 | View Transition API / 库 | NavigationStack 转场 | Navigation 转场 + Shared Element | 页面路由转场 |
| 手势反馈 | pointer events / touch-action | UIKit手势 / SwiftUI手势 | MotionEvent | 鸿蒙手势 |

- 各端 spec 补充该端特有的动效实现要点，但时长/缓动/原则引用本 spec
- 禁在各端 spec 中重新定义时长范围或缓动曲线（DRY）

## 交互声音质感（UI SFX）

声音是「动态质感」的另一半。无声的高保真原型在 demo 场景下会被感知为廉价。声音用于**加强因果关系**（与动效同责）：操作要有可辨识的听觉反馈，但要克制、可关。

### 声音原则

| 原则 | 说明 |
|------|------|
| 因果优先 | 声音反馈操作结果（点击/成功/错误/完成），不是背景音乐 |
| 克制 | 高频交互（hover）不加音，只有结果性动作（提交/切换/成功/错误）才出声 |
| 频段隔离 | 反馈声在中高频，柔和不刺耳；低频与 BGM 冲突则去 BGM 或错开 |
| 可关 | 提供静音开关，尊重系统静音/音量 |
| 与动效同步 | 声音节奏与动效时长一致（如 150ms 反馈声配 duration-fast 按压缩放） |

### 交互声音清单（按触发动作，非按页面）

| 动作 | 声音类型 | 时长 | 说明 |
|------|---------|------|------|
| 按钮按压 | 短促低频 click | 80-150ms | 反馈「按下了」，配 scale 0.95 释放回弹 |
| 开关切换 | 中频 toggle | 150-200ms | 明确的开/关切换 |
| 列表/选项选中 | 高频 pop | 100-150ms | 轻快的「选中了」 |
| 模态/弹窗打开 | 短 whoosh | 200-300ms | 配模态 scale+fade 入场 |
| 提交成功 | 上行和弦 chime | 400-600ms | 明确「完成」的意思 |
| 操作错误 | 低频 error 音 | 200-400ms | 只能用于错误打断，不可滥用 |
| 通知/提醒 | 中频 notification pop | 200-300ms | 新消息到达 |

- 声音都是**短促、一次性的结果反馈**，不是循环 BGM/音频流
- 音量从低起，不霸占操作系统音量级别
- 同类动作全站统一一个声音，禁止每个页面各自发明

### 声音 Token

```
sound-duration-click: 100ms
sound-duration-toggle: 180ms
sound-duration-pop: 120ms
sound-duration-modal: 250ms
sound-duration-success: 500ms
sound-duration-error: 300ms
sound-duration-notify: 250ms
```

- 声音时长与对应动效 Token 配对（`duration-fast`↔click/toggle/pop，`duration-normal`↔modal，`duration-slow`↔success）
- 音源统一放 `design/output/assets/sfx/<category>/`，命名按动作语义（`/ui/click.mp3`, `/feedback/success.mp3`），不按页码

### 实现要点

- HTML 高保真原型用 `<audio>` + WebAudio 播放预制 `.mp3`；浏览器自动播放策略下，首次用户交互后解锁
- 每个人都可关：全局静音开关（默认关即开），关闭后不播放任何反馈音
- 尊重系统减弱/静音设置；无声设备自动跳过，不报错

## 验收标准

- [ ] 时长 Token 已定义（fast/normal/slow），禁超 500ms
- [ ] 退场比入场快 60-70%
- [ ] 缓动 Token 已定义，禁用 linear
- [ ] 只动 transform/opacity，不动 width/height
- [ ] 入场用 ease-out，退场用 ease-in
- [ ] 列表错峰 30-50ms/项
- [ ] 尊重 reduced-motion，降级为淡入淡出
- [ ] 动效可中断，不阻塞输入
- [ ] 加载 > 300ms 用骨架屏，禁长时间 spinner
- [ ] 页面转场方向与导航层级语义一致
- [ ] 每个动效能回答「它告诉用户什么」
- [ ] 结果性动作（提交/切换/成功/错误/弹窗）有对应 UI 声音，且与动效时长配对
- [ ] 高频交互（hover）不加音，只有结果性动作出声
- [ ] 声音短促一次性，非循环 BGM
- [ ] 提供静音开关，尊重系统静音/减弱设置

## 边界与不做项

- 不定义品牌视觉（色彩/字体见 `specs/brand`）
- 不定义 Token 架构与组件（见 `specs/design-system`，动效 Token 归属设计系统）
- 各端平台特有动效实现（如 iOS 转场 API、Android Shared Element）由各端 spec 补充
- 动效代码实现由开发负责，本规范止于动效设计
- **声音只做「结果性交互反馈」**，不定义背景音乐/电影配乐编排（那是内容生产场景，见 huashu-design 的音频管线）；本规范不承担 BGM、解说、音效设计脚本等叙事型音频
