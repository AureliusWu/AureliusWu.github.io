# AureliusWu.github.io

个人作品集，托管于 [aureliuswu.github.io](https://aureliuswu.github.io/)。

## 定位

面向招聘和项目介绍，展示五个项目解决的问题、技术栈与功能示意。首页负责总览和跳转，公开展示页说明实现重点，不包含应用业务逻辑。

## 当前版本

**v1.2.0 · 2026-10-02**。首页补充项目用途、技术栈和明确的入口。电脑端保留紧凑总览，手机端改为可读的单列布局与 44px Demo 按钮，允许自然滚动。司忆与 ImageLore 从首页进入公开展示页，无需 GitHub 权限。五个 Demo 仍为明确标注的 15 秒功能示意，非实际操作录屏。完整记录见 [CHANGELOG.md](CHANGELOG.md)。

## 当前项目

| 项目 | 形态 | 入口与用途 | Demo |
| --- | --- | --- | --- |
| 蜉蝣基金 / FundVal | 网页应用 | [打开应用](https://aureliuswu.github.io/FundVal/)：基金盘中估值监控 PWA。 | [功能示意视频](demos/fundval.html) |
| 司南基金 / fund-compass | 网页应用 | [打开应用](https://aureliuswu.github.io/fund-compass/)：基金选基、择时与资产分析。 | [功能示意视频](demos/fund-compass.html) |
| 全球新闻 / News | 网页应用 | [打开应用](https://aureliuswu.github.io/News/)：地区与来源筛选、关键词搜索和原文跳转；使用定时快照。 | [功能示意视频](demos/news.html) |
| 司忆 / Agent | 桌面项目 | [公开展示页](demos/agent.html)：个人 Agent 工作台，支持工具、记忆及任务执行。 | [功能示意视频](demos/agent.html) |
| ImageLore | 桌面项目 | [公开展示页](demos/imagelore.html)：本地优先的 AI 视觉生成记忆库，保存生成参数、版本与谱系，支持语义召回及以图找图。 | [功能示意视频](demos/imagelore.html) |

司忆与 ImageLore 的首页入口与展示页均可公开浏览。展示页保留标明“需权限”的可选源码链接，源码仓库仍为私有。其余三个入口为公开网页应用。

## 技术

- 主页 `index.html` 与五个静态 `demos/*.html` 播放页。
- CSS 与 SVG 界面示意预览内联。
- 零构建、零运行时依赖；无外部字体或脚本。首页 HTML 不超过 24 KiB，gzip 不超过 6.5 KB。
- 静态门禁 `scripts/check-homepage.mjs` 仅使用 Node.js 内置模块。
- `scripts/check-browser.mjs` 用 Playwright 检查 Chrome 桌面、Android 与 WebKit/iPhone 模拟视窗；测试工具仅在开发/CI 安装，不进入网页。
- 视频采用 H.264 MP4、720p、15 秒、无音频及 fast-start，单段不超过 1 MiB；只在播放页按需加载，主页不请求视频。
- `demos/catalog.json` 保存项目映射与三段说明，`demos/media/` 保存视频、SVG 封面及 WebVTT 中文字幕。

## 开发

直接编辑静态 HTML。每个 `article.project-item` 包含一个 `a.project-card` 和一个并列的 `a.demo-link`，避免嵌套链接。项目卡片包含 `h2` 标题和带可读名称的 SVG 预览；`data-project` 使用仓库名。新增或替换视频时同步核对播放页、封面、字幕和 `demos/catalog.json`。修改后运行：

```sh
node scripts/check-homepage.mjs
```

静态门禁验证三个版本标识、五个项目名称与链接、预览资源、空链接及外部脚本/样式依赖，并检查 Demo 对应关系、视频快速起播结构、文件大小、按需加载和中文字幕。浏览器回归验证 320–1440px 视窗、横屏、相当于桌面 200% 缩放的窄视窗、触控目标、键盘焦点、标题/预览/Demo/返回跳转、初始请求与视频播放。Chrome 验证 H.264 播放，WebKit 补充 iPhone 布局与链接检查。`preload="none"` 是浏览器提示，WebKit 可能预先请求视频数据，回归记录请求并验证不会自动播放；首页在所有检查环境中均不请求视频。CI 将截图和 JSON 结果保存为 `browser-report`；浏览器模拟不替代真机与招聘者所在网络的可达性检查。

开发环境运行浏览器回归：

```sh
npm install --no-save --package-lock=false playwright@1.63.0
npx playwright install --with-deps chrome webkit
node scripts/check-browser.mjs
```

## 版本管理

- 主页版本独立于五个项目，遵循 `主版本.次版本.修订版本`；不兼容的结构调整升级主版本，功能增加升级次版本，修正升级修订版本。
- 发布时同步修改 `VERSION`、`index.html` 的 `application-version` 元数据，以及可见的 `#site-version`（格式为 `v1.2.0`）。
- 在本文件与 `CHANGELOG.md` 记录版本和日期；通过静态门禁与浏览器验收后，将改动提交并使用同版本 Git 标签（如 `v1.0.0`）标记发布。

## 部署

推送 `main` 分支后，GitHub Pages 自动部署。发布后核对线上可见版本、五个项目入口、五个公开展示/Demo 页面与视频播放；保留上一发布标签作为回滚依据。

## 访问性能

首页为单个静态文档，SVG 与 CSS 内联，首屏不请求视频或第三方资源。代码体积预算保证页面轻量，无法消除 DNS、TLS 或托管线路的网络等待。独立域名可作为稳定的简历入口；若仍指向 GitHub Pages，网站依然由 GitHub Pages 提供，需在目标访问网络实际验证。迁移托管时保留相对展示/媒体链接，并单独处理三个网页应用的可达性。
