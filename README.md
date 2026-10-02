# AureliusWu.github.io

个人项目索引页，托管于 [aureliuswu.github.io](https://aureliuswu.github.io/)。

## 定位

这是 AureliusWu 的 GitHub Pages 主页，用于集中展示项目入口。它只负责索引、跳转和品牌展示，不包含各应用的业务逻辑。

## 当前版本

**v1.1.0 · 2026-10-02**。五个项目各有独立的 **Demo** 按钮，点击可进入对应的视频播放页；标题、预览图和卡片仍可直接进入项目。视频为 15 秒功能示意，基于主页现有 SVG 展示三个核心步骤，非实际操作录屏，不代表实时业务数据。完整记录见 [CHANGELOG.md](CHANGELOG.md)。

## 当前项目

| 项目 | 形态 | 入口与用途 | Demo |
| --- | --- | --- | --- |
| 蜉蝣基金 / FundVal | 网页应用 | [打开应用](https://aureliuswu.github.io/FundVal/)：基金盘中估值监控 PWA。 | [功能示意视频](demos/fundval.html) |
| 司南基金 / fund-compass | 网页应用 | [打开应用](https://aureliuswu.github.io/fund-compass/)：基金选基、择时与资产分析。 | [功能示意视频](demos/fund-compass.html) |
| 全球新闻 / News | 网页应用 | [打开应用](https://aureliuswu.github.io/News/)：地区与来源筛选、关键词搜索和原文跳转；使用定时快照。 | [功能示意视频](demos/news.html) |
| 司忆 / Agent | 桌面项目 | [GitHub 项目页](https://github.com/AureliusWu/Agent)：个人 Agent 工作台，支持工具、记忆及任务执行。 | [功能示意视频](demos/agent.html) |
| ImageLore | 桌面项目 | [GitHub 项目页](https://github.com/AureliusWu/ImageLore)：本地优先的 AI 视觉生成记忆库，保存生成参数、版本与谱系，支持语义召回及以图找图。 | [功能示意视频](demos/imagelore.html) |

司忆与 ImageLore 的仓库在本次发布核对时为私有，页面标明“需权限”；访问其项目页需登录有仓库访问权限的 GitHub 账号。其余三个入口为公开网页。

## 技术

- 主页 `index.html` 与五个静态 `demos/*.html` 播放页。
- CSS 与 SVG 界面示意预览内联。
- 零构建、零运行时依赖。
- 静态门禁 `scripts/check-homepage.mjs` 仅使用 Node.js 内置模块。
- 视频采用 H.264 MP4、720p、15 秒、无音频及 fast-start，单段不超过 1 MiB；只在播放页按需加载，主页不请求视频。
- `demos/catalog.json` 保存项目映射与三段说明，`demos/media/` 保存视频、SVG 封面及 WebVTT 中文字幕。

## 开发

直接编辑静态 HTML。每个 `article.project-item` 包含一个 `a.project-card` 和一个并列的 `a.demo-link`，避免嵌套链接。项目卡片仍包含 `h2` 标题和带可读名称的 SVG 预览；`data-project` 使用仓库名。新增或替换视频时同步核对播放页、封面、字幕和 `demos/catalog.json`。修改后运行：

```sh
node scripts/check-homepage.mjs
```

静态门禁验证三个版本标识、五个项目名称与链接、预览资源、空链接及外部脚本/样式依赖，并检查 Demo 对应关系、视频快速起播结构、文件大小、按需加载和中文字幕。另需在浏览器检查桌面与移动视窗的布局、键盘焦点、标题/预览/独立 Demo 按钮跳转及视频实际播放；静态门禁不替代浏览器验收或线上可用性检查。

## 版本管理

- 主页版本独立于五个项目，遵循 `主版本.次版本.修订版本`；不兼容的结构调整升级主版本，功能增加升级次版本，修正升级修订版本。
- 发布时同步修改 `VERSION`、`index.html` 的 `application-version` 元数据，以及可见的 `#site-version`（格式为 `v1.1.0`）。
- 在本文件与 `CHANGELOG.md` 记录版本和日期；通过静态门禁与浏览器验收后，将改动提交并使用同版本 Git 标签（如 `v1.0.0`）标记发布。

## 部署

推送 `main` 分支后，GitHub Pages 自动部署。发布后核对线上可见版本、五个项目入口、五个 Demo 页面与视频播放；保留上一发布标签作为回滚依据。
