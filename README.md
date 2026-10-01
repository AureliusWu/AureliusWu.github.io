# AureliusWu.github.io

个人项目索引页，托管于 [aureliuswu.github.io](https://aureliuswu.github.io/)。

## 定位

这是 AureliusWu 的 GitHub Pages 主页，用于集中展示项目入口。它只负责索引、跳转和品牌展示，不包含各应用的业务逻辑。

## 当前版本

**v1.0.0 · 2026-10-01**。本版将五个项目集中为紧凑总览，点击标题、预览图或卡片即可进入。预览为界面示意，不代表应用的实时数据。完整记录见 [CHANGELOG.md](CHANGELOG.md)。

## 当前项目

| 项目 | 形态 | 入口与用途 |
| --- | --- | --- |
| 蜉蝣基金 / FundVal | 网页应用 | [打开应用](https://aureliuswu.github.io/FundVal/)：基金盘中估值监控 PWA。 |
| 司南基金 / fund-compass | 网页应用 | [打开应用](https://aureliuswu.github.io/fund-compass/)：基金选基、择时与资产分析。 |
| 全球新闻 / News | 网页应用 | [打开应用](https://aureliuswu.github.io/News/)：地区与来源筛选、关键词搜索和原文跳转；使用定时快照。 |
| 司忆 / Agent | 桌面项目 | [GitHub 项目页](https://github.com/AureliusWu/Agent)：个人 Agent 工作台，支持工具、记忆及任务执行。 |
| ImageLore | 桌面项目 | [GitHub 项目页](https://github.com/AureliusWu/ImageLore)：本地优先的 AI 视觉生成记忆库，保存生成参数、版本与谱系，支持语义召回及以图找图。 |

司忆与 ImageLore 的仓库在本次发布核对时为私有，页面标明“需权限”；访问其项目页需登录有仓库访问权限的 GitHub 账号。其余三个入口为公开网页。

## 技术

- 单页 `index.html`。
- CSS 与 SVG 界面示意预览内联。
- 零构建、零运行时依赖。
- 静态门禁 `scripts/check-homepage.mjs` 仅使用 Node.js 内置模块。

## 开发

直接编辑 `index.html`。每张卡片为一个 `a.project-card`，包含 `h2` 标题和带可读名称的 SVG 预览；`data-project` 使用仓库名。修改后运行：

```sh
node scripts/check-homepage.mjs
```

静态门禁验证三个版本标识、五个项目名称与链接、预览资源、空链接及外部脚本/样式依赖。另需在浏览器检查常用桌面与移动视窗的一屏布局、键盘焦点，以及标题和预览的点击行为；静态门禁不替代浏览器验收或线上可用性检查。

## 版本管理

- 主页版本独立于五个项目，遵循 `主版本.次版本.修订版本`；不兼容的结构调整升级主版本，功能增加升级次版本，修正升级修订版本。
- 发布时同步修改 `VERSION`、`index.html` 的 `application-version` 元数据，以及可见的 `#site-version`（格式为 `v1.0.0`）。
- 在本文件与 `CHANGELOG.md` 记录版本和日期；通过静态门禁与浏览器验收后，将改动提交并使用同版本 Git 标签（如 `v1.0.0`）标记发布。

## 部署

推送 `main` 分支后，GitHub Pages 自动部署。发布后核对线上可见版本、五个入口和页面布局；保留上一发布标签作为回滚依据。
