# AureliusWu.github.io

个人作品集：[aureliuswu.github.io](https://aureliuswu.github.io/)。用于招聘与项目介绍，主页提供项目总览，`demos/` 提供公开案例与功能示意。

当前主页版本：`v1.6.0`。主页版本独立于各应用版本。

## 当前项目

| 项目 | 形态 | 应用状态 | 入口与用途 | Demo |
| --- | --- | --- | --- | --- |
| 蜉蝣基金 / FundVal | 网页应用 | 正式发布 `v16.0.2` | [公开案例](demos/fundval.html)，[打开应用](https://aureliuswu.github.io/FundVal/)：基金盘中观察、本地 OCR 确认导入与行情隔离。 | [功能示意视频](demos/fundval.html) |
| 司南基金 / fund-compass | 网页应用 | 源码版本 `v8.0.0`；暂无正式发布 | [公开案例](demos/fund-compass.html)，[打开应用](https://aureliuswu.github.io/fund-compass/)：筛选、评分、信号、回测与证据条件。 | [功能示意视频](demos/fund-compass.html) |
| 全球新闻 / News | 网页应用 | 正式发布（带已知限制） `v1.1.0` | [公开案例](demos/news.html)，[打开应用](https://aureliuswu.github.io/News/)：同代快照、事件聚合、多来源筛选与原文跳转；AI 摘要和翻译未启用。 | [功能示意视频](demos/news.html) |
| 司忆 / Agent | 桌面项目 | 开发候选 `v17.0.2`；正式发布 `v17.0.2` | [公开案例](demos/agent.html)：持久任务、受控执行、按验收要求验证与限定返工；内置批量文件操作。 | [功能示意视频](demos/agent.html) |
| ImageLore | 桌面项目 | 正式发布（带已知限制） `v1.0.0` | [公开案例](demos/imagelore.html)：生成记忆、Visual DNA、Remix 多参考与 Reference Inbox，保留本地检索和生成谱系。 | [功能示意视频](demos/imagelore.html) |

项目版本由 Portfolio Sync 自动维护，生成结果见 `data/projects.json`。案例分别说明源码、候选、预发布与正式发布。首页保留固定应用入口；[公开仓库目录](repositories.html)及首页计数按 GitHub 的公开清单同步，新增公开仓库自动加入，不再公开时移出目录。

## 本地验证

```bash
node --test scripts/project-card.test.mjs
node scripts/check-portfolio-sync.mjs
node scripts/check-homepage.mjs
```

浏览器回归需要 Playwright：

```bash
npm install --no-save --package-lock=false playwright@1.63.0
npx playwright install --with-deps chrome webkit
node scripts/check-browser.mjs
```

## AI / 维护者入口

修改前先读 [AGENTS.md](AGENTS.md)。

- 项目版本和公开仓库：`data/projects.json`、`data/repositories.json`，由 `.github/workflows/portfolio-sync.yml` / `scripts/sync-projects.mjs` 同步生成；不要手工维护生成文件。
- 作品集内容依据：`docs/portfolio-content.md`。
- Demo 映射与媒体：`demos/catalog.json`、`demos/media/`。
- 主页门禁：`scripts/check-homepage.mjs`、`scripts/check-browser.mjs`。
- 更新历史：`CHANGELOG.md`。

首页继续保持纯静态、无外部脚本或字体，首屏只允许加载同源小图标。HTML gzip 上限仍为 6.5 KB。项目源码公开不等于正式发行或完整设备验收。

## 部署

推送 `main` 或手动触发部署工作流，会在通过检查后发布到 GitHub Pages。Portfolio Sync 每小时核对项目版本；变化通过检查后提交，再显式请求发布。线上提交与资源通过 [部署检查](scripts/check-deployed-homepage.mjs) 核对。详见 [同步和发布流程](.github/portfolio-sync-v1.md)。
