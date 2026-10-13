# AureliusWu.github.io

个人作品集，托管于 [aureliuswu.github.io](https://aureliuswu.github.io/)。

## 定位

面向招聘和项目介绍，展示五个项目解决的问题、技术栈与功能示意。首页负责总览和跳转，公开展示页说明实现重点，不包含应用业务逻辑。

## 当前版本

**v1.4.0 · 2026-10-13**。按当前五个公开仓库重新核对作品集，补充真实实现依据、应用版本和发行边界。司忆与 ImageLore 为代表项目，五张卡片均进入公开案例；Demo 按钮直达视频区域。桌面保持紧凑总览，手机使用可读单列并允许自然滚动。联系方式使用公开 GitHub 主页，不添加未指定的邮箱或简历。五个视频仍为明确标注的 15 秒功能示意，非实际操作录屏。固定源码提交与能力依据见 [作品集内容依据](docs/portfolio-content.md)，更新记录见 [CHANGELOG.md](CHANGELOG.md)。主页版本不代表五个应用的版本或正式发行资格。

## 当前项目

| 项目 | 形态 | 应用状态 | 入口与用途 | Demo |
| --- | --- | --- | --- | --- |
| 蜉蝣基金 / FundVal | 网页应用 | `15.0.2`；V16 未发行，真机验收边界保留 | [公开案例](demos/fundval.html)，[打开应用](https://aureliuswu.github.io/FundVal/)：基金盘中观察、本地 OCR 确认导入与行情隔离。 | [功能示意视频](demos/fundval.html) |
| 司南基金 / fund-compass | 网页应用 | `8.0.0` 候选；正式耐久存储门禁未解除 | [公开案例](demos/fund-compass.html)，[打开应用](https://aureliuswu.github.io/fund-compass/)：筛选、评分、信号、回测与证据条件。 | [功能示意视频](demos/fund-compass.html) |
| 全球新闻 / News | 网页应用 | `0.9.0-alpha.1` M5 候选 | [公开案例](demos/news.html)，[打开应用](https://aureliuswu.github.io/News/)：同代快照、事件聚合、多来源筛选与原文跳转；AI 摘要和翻译未启用。 | [功能示意视频](demos/news.html) |
| 司忆 / Agent | 桌面项目 | `16.0.0` 开发候选；历史安装包为 `v8.0.1` | [公开案例](demos/agent.html)：持久任务、受控执行、按验收要求验证与限定返工；内置批量文件操作。 | [功能示意视频](demos/agent.html) |
| ImageLore | 桌面项目 | `0.26.0`；无正式安装包 | [公开案例](demos/imagelore.html)：生成记忆、Visual DNA、Remix 多参考与 Reference Inbox，保留本地检索和生成谱系。 | [功能示意视频](demos/imagelore.html) |

截至 2026-10-13，五个源码仓库均为公开：[Agent](https://github.com/AureliusWu/Agent)、[ImageLore](https://github.com/AureliusWu/ImageLore)、[FundVal](https://github.com/AureliusWu/FundVal)、[fund-compass](https://github.com/AureliusWu/fund-compass)、[News](https://github.com/AureliusWu/News)。源码可访问不代表当前版本有安装包、已正式发行或完成设备验收；司南私人 owner 数据与决策面板仍受鉴权限制。应用异常不应阻断公开案例和视频介绍。

## 技术

- 主页 `index.html` 与五个静态 `demos/*.html` 项目案例与视频页。
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

静态门禁验证三个版本标识、五个项目名称与链接、预览资源、空链接及外部脚本/样式依赖，并检查 Demo 对应关系、视频快速起播结构、文件大小、按需加载和中文字幕。浏览器回归验证 320–1440px 视窗、横屏、相当于桌面 200% 缩放的窄视窗、触控目标、键盘焦点、标题/预览/视频定位、公开案例/应用/返回跳转、初始请求与视频播放。Chrome 验证 H.264 播放，WebKit 补充 iPhone 布局与链接检查。`preload="none"` 是浏览器提示，WebKit 可能预先请求视频数据，回归记录请求并验证不会自动播放；首页在所有检查环境中均不请求视频。CI 将截图和 JSON 结果保存为 `browser-report`；浏览器模拟不替代真机与招聘者所在网络的可达性检查。

开发环境运行浏览器回归：

```sh
npm install --no-save --package-lock=false playwright@1.63.0
npx playwright install --with-deps chrome webkit
node scripts/check-browser.mjs
```

## 版本管理

- 主页版本独立于五个项目，遵循 `主版本.次版本.修订版本`；不兼容的结构调整升级主版本，功能增加升级次版本，修正升级修订版本。
- 发布时同步修改 `VERSION`、`index.html` 的 `application-version` 元数据，以及可见的 `#site-version`（格式为 `v1.4.0`）。
- 在本文件与 `CHANGELOG.md` 记录版本和日期；通过静态门禁与浏览器验收后，将改动提交并使用同版本 Git 标签（如 `v1.4.0`）标记发布。

## 部署

推送 `main` 分支后，GitHub Pages 自动部署。发布后核对线上可见版本、五个项目入口、五个公开展示/Demo 页面与视频播放；保留上一发布标签作为回滚依据。

## 访问性能

首页为单个静态文档，SVG 与 CSS 内联，首屏不请求视频或第三方资源。代码体积预算保证页面轻量，无法消除 DNS、TLS 或托管线路的网络等待。独立域名可作为稳定的简历入口；若仍指向 GitHub Pages，网站依然由 GitHub Pages 提供，需在目标访问网络实际验证。迁移托管时保留相对展示/媒体链接，并单独处理三个网页应用的可达性。
