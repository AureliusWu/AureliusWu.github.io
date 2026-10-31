# Portfolio Sync v1

- 每小时与手动触发同步公开项目版本。
- FundVal / News / ImageLore 以最新正式 GitHub Release 为主页版本来源。
- Agent / fund-compass 以各自 README 的当前版本为来源，同时记录最新正式 Release（若存在）。
- 生成 `data/projects.json`，并同步 README、首页项目卡和五个案例页。
- 私有仓库不由公开作品集工作流查询。
- 同步后运行元数据一致性、主页静态门禁与浏览器验收；仅在内容变化时提交。
- 首页继续保持无脚本、无外部样式和零额外网络请求；favicon 使用最小内联 data URI，且保留既有 6.5 KB gzip 门禁。
