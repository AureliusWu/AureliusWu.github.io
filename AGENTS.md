# AGENTS.md

## 项目识别

- 目录名：`AureliusWu.github.io`
- 中文名：主页
- 用户说「主页」时，指本项目。
- 线上形态：AureliusWu 的 GitHub Pages 个人项目索引页。

## 项目定位

主页是面向招聘与项目展示的轻量个人作品集，说明项目用途、技术栈并提供公开的展示入口。它不是应用本体，不承载基金估值、选基、持仓同步或后端 API 逻辑。

## 技术结构

- 静态 HTML 主页及五个独立 Demo 播放页。
- CSS 内联。
- 零运行时外部依赖、零构建流程；浏览器回归只在开发/CI 环境安装 Playwright。
- 入口文件：`index.html`。
- 界面示意预览：内联 SVG，不展示实时业务数据。
- Demo 清单：`demos/catalog.json`；播放页：`demos/*.html`；视频、封面和字幕：`demos/media/`。
- 文档：`README.md`、`CHANGELOG.md`。
- 版本来源：`VERSION`。
- 静态门禁：`node scripts/check-homepage.mjs`。

## 开发规则

- 保持页面轻量，不引入框架、构建工具或大体积资源。
- 修改项目卡片时，核对项目名称、链接、描述和状态。
- 主页只做索引和品牌展示，不复制项目业务逻辑。
- 视觉保持克制、清爽、浅色主题。
- 桌面优先保持紧凑总览，手机使用可读的单列布局并允许自然滚动；不得为塞进一屏而压缩文字或按钮。Demo 触控目标不小于 44 × 44 CSS 像素，核对较矮视窗、横屏和放大字体。
- 每个项目使用单个 `a.project-card` 包裹标题和预览，标题为 `h2`；禁止嵌套链接。`data-project` 使用下方仓库名。
- `article.project-item` 包裹项目卡片与并列的 `a.demo-link`，Demo 按钮不可放进项目链接内。
- Demo 为明确标注的功能示意视频，非实际操作录屏；不使用真实持仓、私有任务或用户图片数据。
- 视频使用单段不超过 1 MiB 的 H.264 MP4、fast-start 和中文字幕；播放页使用 `controls playsinline preload="none"`，不自动播放。主页不加载视频资源。
- SVG 预览使用 `preview-image` 类、`role="img"` 及非空 `title`，保证键盘与辅助技术可使用。
- 发布前通过静态门禁并在浏览器验证布局、标题/预览/Demo 跳转、键盘焦点和视频播放。
- 首页 HTML 不超过 24 KiB，gzip 不超过 6.5 KB；不加载脚本、外部字体或视频。性能结论应区分文档体积和外部网络连接耗时。

## 版本管理

- 主页独立使用语义化版本；首个受管版本为 `1.0.0`（2026-10-01）。
- 同步维护 `VERSION`、HTML 的 `meta[name="application-version"]` 和可见 `span#site-version`；前两处使用裸版本号，后者带 `v` 前缀。
- 每次发布更新 `CHANGELOG.md` 与 `README.md`，验收后使用同版本 Git 标签。
- 主页版本不代表所链接应用的版本，不在入口中硬编码未经核实的应用版本。

## 项目映射

- `FundVal`：蜉蝣基金。
- `fund-compass`：司南基金。
- `News`：全球新闻。
- `Agent`：司忆。
- `ImageLore`：ImageLore。
- 前三个卡片链接到 GitHub Pages 应用；后两个卡片链接到公开展示页 `demos/agent.html` 与 `demos/imagelore.html`，无需 GitHub 账号即可浏览。
- 后两个仓库为私有，展示页中的可选源码入口标明“需权限”；首页不可直接把招聘访问者送到私有仓库。

## 项目边界

用户说「蜉蝣基金」「司南基金」「全球新闻」「司忆」或「ImageLore」时，应切换到对应仓库，不要在主页仓库改应用功能。`pan`（盘中宝）也是独立仓库，当前不在主页的五个入口中。
