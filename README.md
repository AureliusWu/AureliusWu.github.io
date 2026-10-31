# AureliusWu.github.io

个人作品集：[aureliuswu.github.io](https://aureliuswu.github.io/)。用于招聘与项目介绍，主页提供项目总览，`demos/` 提供公开案例与功能示意。

当前主页版本：`v1.4.0`。主页版本独立于各应用版本。

## 当前项目

| 项目 | 形态 | 应用状态 | 入口与用途 | Demo |
| --- | --- | --- | --- | --- |
| 蜉蝣基金 / FundVal | 网页应用 | `16.0.1` 正式版（带已知限制） | [公开案例](demos/fundval.html)，[打开应用](https://aureliuswu.github.io/FundVal/)：基金盘中观察、本地 OCR 确认导入与行情隔离。 | [功能示意视频](demos/fundval.html) |
| 司南基金 / fund-compass | 网页应用 | `8.0.0` 开发候选 | [公开案例](demos/fund-compass.html)，[打开应用](https://aureliuswu.github.io/fund-compass/)：筛选、评分、信号、回测与证据条件。 | [功能示意视频](demos/fund-compass.html) |
| 全球新闻 / News | 网页应用 | `1.1.0` 正式版（带已知限制） | [公开案例](demos/news.html)，[打开应用](https://aureliuswu.github.io/News/)：同代快照、事件聚合、多来源筛选与原文跳转；AI 摘要和翻译未启用。 | [功能示意视频](demos/news.html) |
| 司忆 / Agent | 桌面项目 | `16.0.1` 开发 / 用户测试基线；最新正式 Release `8.0.1` | [公开案例](demos/agent.html)：持久任务、受控执行、按验收要求验证与限定返工；内置批量文件操作。 | [功能示意视频](demos/agent.html) |
| ImageLore | 桌面项目 | `1.0.0` 正式版（带已知限制） | [公开案例](demos/imagelore.html)：生成记忆、Visual DNA、Remix 多参考与 Reference Inbox，保留本地检索和生成谱系。 | [功能示意视频](demos/imagelore.html) |

项目版本由 Portfolio Sync 自动维护，事实源见 `data/projects.json`。

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

- 项目版本与状态：`data/projects.json`，由 `.github/workflows/portfolio-sync.yml` / `scripts/sync-projects.mjs` 自动同步；不要手工维护多份版本真相。
- 作品集内容依据：`docs/portfolio-content.md`。
- Demo 映射与媒体：`demos/catalog.json`、`demos/media/`。
- 主页门禁：`scripts/check-homepage.mjs`、`scripts/check-browser.mjs`。
- 更新历史：`CHANGELOG.md`。

首页继续保持纯静态、无外部脚本 / 字体依赖、零额外首屏请求和现有体积门禁。项目源码公开不等于正式发行或完整设备验收。

## 部署

推送 `main` 后由 GitHub Pages 部署。项目版本变化由 Portfolio Sync 定时检查；只有检测到变化并通过一致性、静态与浏览器验收后才提交。
