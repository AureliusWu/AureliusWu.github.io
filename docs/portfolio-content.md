# 作品集内容依据

核对日期：2026-10-13（Asia/Shanghai）。主页版本：v1.4.0。

## 展示约定

- 用户选择「AI 产品与应用」方向，联系入口先使用公开 GitHub 主页。
- 展示个人项目的需求、流程设计与 AI 辅助开发，不虚构职业经历、用户规模、业务收益、独立手写代码比例或性能改善。
- 司忆与 ImageLore 为代表项目。五个源码仓库和案例页均已公开，源码入口不再标记需要权限；私人业务数据仍遵守应用鉴权。
- 现有五段视频仍为界面功能示意，非真实操作录屏；本次公开资料核对不改变其证据等级。
- 桌面保持紧凑总览，移动端保留可读单列与自然滚动；卡片进入案例，Demo 直达视频，Web 应用入口保留在案例页。
- 首页体积和浏览器回归仅说明作品集页面，不能替代所链接应用的功能、正式发布或实体设备验收。
- 主页版本、应用版本、源码提交和实际发行分别记录，不以仓库公开、README 功能清单或单次 HTTP 200 推断已完整上线。

## 源码与发行边界

以下为核对时的公开 `main`，固定 SHA 用于复查内容，不代表五个应用都部署了该提交。

| 项目 | 公开主线 SHA | 应用版本与发行边界 |
| --- | --- | --- |
| 司忆 / Agent | [`8251d69b6e2e624e2a9e15c6dca871c0f047e3fc`](https://github.com/AureliusWu/Agent/tree/8251d69b6e2e624e2a9e15c6dca871c0f047e3fc) | `16.0.0` 开发候选；历史 GitHub 安装包为 `v8.0.1`，不能用来证明当前开发版可下载安装或已完成发行验收。 |
| ImageLore | [`c94028dcc9468088fc6e5cdcfe4c2b40fcce0531`](https://github.com/AureliusWu/ImageLore/tree/c94028dcc9468088fc6e5cdcfe4c2b40fcce0531) | `0.26.0`；无正式安装包，当前运行与设备验收范围以对应文档为准。 |
| 蜉蝣基金 / FundVal | [`abfb6313f12efb66b9096b60472b6dd457094485`](https://github.com/AureliusWu/FundVal/tree/abfb6313f12efb66b9096b60472b6dd457094485) | 源码/线上版本 `15.0.2`；主线包含 V16 预发布工作，V16 未发行，物理 Android/iOS 验收限制保留。 |
| 司南基金 / fund-compass | [`d749647e47b8bf819f4b41d1271e578f0804f49e`](https://github.com/AureliusWu/fund-compass/tree/d749647e47b8bf819f4b41d1271e578f0804f49e) | `8.0.0` 候选部署；生产跨重启耐久存储门禁未解除，不宣称正式发行。私人 owner 面板仍受鉴权限制。 |
| 全球新闻 / News | [`b0f3b2b4bd2364f7ecf56d1f16e86bfb6a66abd8`](https://github.com/AureliusWu/News/tree/b0f3b2b4bd2364f7ecf56d1f16e86bfb6a66abd8) | `0.9.0-alpha.1` M5 候选；应用发布提交 `1592e7919f9c132d891a9bd0fae87a8c9569baec` 与当前文档主线分开记录，七天观测与设备验收未全部完成。 |

五个仓库均公开；FundVal 与 fund-compass 本次核对的 GitHub Releases 列表为空，这不等于没有 Pages 部署。安装包、生产部署和正式发行资格分别按各项目的现有证据说明。

## 已核实的实现依据

| 项目 | 固定提交依据 | 作品集可使用的能力 |
| --- | --- | --- |
| 司忆 / Agent | [插件发现与内置能力](https://github.com/AureliusWu/Agent/blob/8251d69b6e2e624e2a9e15c6dca871c0f047e3fc/siyi/app/plugins/discovery.py)、[验收与验证](https://github.com/AureliusWu/Agent/blob/8251d69b6e2e624e2a9e15c6dca871c0f047e3fc/siyi/app/runtime/verification.py)、[16.0.0 实施状态](https://github.com/AureliusWu/Agent/blob/8251d69b6e2e624e2a9e15c6dca871c0f047e3fc/docs/16.0.0/IMPLEMENTATION_STATUS.md) | Windows/Tauri + React + FastAPI + SQLite；持久队列、安全点引导、按验收要求验证及限定返工；批量文件改名、按扩展名移动、字面替换；版本预检与恢复记录。不能把开发候选清单写成已完成桌面发行。 |
| ImageLore | [视觉分析](https://github.com/AureliusWu/ImageLore/blob/c94028dcc9468088fc6e5cdcfe4c2b40fcce0531/src-tauri/src/vision.rs)、[Remix](https://github.com/AureliusWu/ImageLore/blob/c94028dcc9468088fc6e5cdcfe4c2b40fcce0531/src-tauri/src/remix.rs)、[浏览器采集](https://github.com/AureliusWu/ImageLore/blob/c94028dcc9468088fc6e5cdcfe4c2b40fcce0531/browser-extension/background.js)、[0.26 当前运行验收](https://github.com/AureliusWu/ImageLore/blob/c94028dcc9468088fc6e5cdcfe4c2b40fcce0531/docs/V0_26_CURRENT_RUNTIME_ACCEPTANCE.md) | 图片与生成记录、Prompt 修订、谱系与 Diff、本地 CLIP 检索；Visual DNA、Remix 多参考字段和 Reference Inbox 采集。可选视觉模型分析与本地索引分开说明，不宣称当前正式安装包已发布。 |
| 蜉蝣基金 / FundVal | [OCR 页面与确认事务](https://github.com/AureliusWu/FundVal/blob/abfb6313f12efb66b9096b60472b6dd457094485/js/ocr-import-page.js)、[行情 Bridge](https://github.com/AureliusWu/FundVal/blob/abfb6313f12efb66b9096b60472b6dd457094485/js/runtime/quote-bridge-client.js)、[15.0.2 发布范围](https://github.com/AureliusWu/FundVal/blob/abfb6313f12efb66b9096b60472b6dd457094485/docs/v15.0.2/RELEASE_CHECKLIST.md)、[V16 预发布状态](https://github.com/AureliusWu/FundVal/blob/abfb6313f12efb66b9096b60472b6dd457094485/docs/v16.0.0/M2_STATUS.md) | 零框架 PWA；独立 OCR 页在选图后加载，本机处理且确认真实份额后才写入；远端 JSONP 在隔离沙箱执行，父页面核对消息来源与结构化响应。V16 日期/收益区间/缓存契约仅作预发布说明。 |
| 司南基金 / fund-compass | [决策证据核心](https://github.com/AureliusWu/fund-compass/blob/d749647e47b8bf819f4b41d1271e578f0804f49e/backend/strategy/decision_v2.py)、[海外精度组件](https://github.com/AureliusWu/fund-compass/blob/d749647e47b8bf819f4b41d1271e578f0804f49e/frontend/src/components/OverseasAccuracyPanel.vue)、[部署边界](https://github.com/AureliusWu/fund-compass/blob/d749647e47b8bf819f4b41d1271e578f0804f49e/docs/DEPLOY.md)、[Turso 候选](https://github.com/AureliusWu/fund-compass/blob/d749647e47b8bf819f4b41d1271e578f0804f49e/docs/TURSO-CANDIDATE.md) | Vue / TypeScript / FastAPI；筛选、评分、信号、回测与索引分片；来源状态、时间和覆盖率影响证据强度；精度组件展示样本、误差与待结算状态。Turso 仍为候选；不能由公开源码推断匿名访问完整私人决策。 |
| 全球新闻 / News | [事件视图](https://github.com/AureliusWu/News/blob/b0f3b2b4bd2364f7ecf56d1f16e86bfb6a66abd8/frontend/src/pages/EventsView.vue)、[数据提供者](https://github.com/AureliusWu/News/blob/b0f3b2b4bd2364f7ecf56d1f16e86bfb6a66abd8/frontend/src/api/providers.ts)、[当前交接与候选边界](https://github.com/AureliusWu/News/blob/b0f3b2b4bd2364f7ecf56d1f16e86bfb6a66abd8/docs/V1.0_HANDOFF.md) | Pages + Actions 快照；事件聚合、多来源筛选和深链接；新闻、健康与事件快照保持同代。热度可解释但不代表事实可信度；AI 摘要与翻译未启用。 |

## 部署证据与限制

- 蜉蝣页面与 `js/version.js` 本次只读核对为 `15.0.2`；较新的主线 SHA 不代表 V16 已生产发行。历史 v15.0.2 发布检查表的测试与 smoke 结果属于该版历史证据。
- 司南 Pages 的 `release.json` 本次只读核对等于 `d749647e47b8bf819f4b41d1271e578f0804f49e`，生产 JS 包可见 `8.0.0`；候选 API 公开健康接口本次 30 秒超时，因此文档期望的 `libsql / turso_candidate / durable=false` 不能当成本次健康接口实测。
- 新闻应用发布提交为 `1592e7919f9c132d891a9bd0fae87a8c9569baec`，当前源码/文档主线为 `b0f3b2b4bd2364f7ecf56d1f16e86bfb6a66abd8`。这两个身份不合并成同一部署结论。
- 本页记录源码与既有只读部署证据；主页 v1.4.0 的验证与发布结果以本次实际门禁和线上核对记录为准。

较新候选与部署文档优先于旧 README 的路线图，不把历史计划写成已上线能力。案例页未使用仓库中的敏感配置、真实持仓、私人任务或用户图片。

## 后续内容更新

- 真实录屏须来自实际运行的程序，使用无私人信息的示例，标明对应版本与录制环境。
- 加入简历、邮箱或岗位信息时使用用户明确指定的公开资料。
- 只有取得可复核样本、条件与记录后，才加入性能、效率或使用量指标。
