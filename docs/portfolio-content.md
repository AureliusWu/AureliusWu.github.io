# 作品集内容依据

案例资料核对日期：2026-11-06（Asia/Shanghai）。下表保留该次内容审校的证据；主页 v1.5.0 起，当前版本及正式发行入口由 Portfolio Sync 单独更新，见 [项目元数据](../data/projects.json)。

- 主页展示个人项目的需求、流程与工程取舍，司忆与 ImageLore 为代表项目。五个案例和源码均公开；私人业务数据仍遵守应用鉴权。
- 五段视频是功能示意。桌面紧凑总览，移动端自然滚动；标题和预览图直达案例，Demo 直达视频。
- 主页版本与项目版本分开。项目版本标识由 Portfolio Sync 生成；以下是本次内容核对的固定证据。主线、构建来源和线上部署可以是不同的提交。

| 项目 | 核对时的公开主线 | 发行或部署证据 |
| --- | --- | --- |
| 司忆 / Agent | [585d3b94ae424aa562ca3073effc178073a12b83](https://github.com/AureliusWu/Agent/tree/585d3b94ae424aa562ca3073effc178073a12b83) | [17.0.1 补丁候选](https://github.com/AureliusWu/Agent/blob/585d3b94ae424aa562ca3073effc178073a12b83/docs/17.0.1/RELEASE_NOTES.md) 尚未发行；最新公开安装包为 [v17.0.0](https://github.com/AureliusWu/Agent/releases/tag/v17.0.0)，构建来源 d447ccd33acb8c71c1b3037008c7463f136a4c2b。 |
| ImageLore | [8f2e027b238a4196bca145a609c86ea84dbcca45](https://github.com/AureliusWu/ImageLore/tree/8f2e027b238a4196bca145a609c86ea84dbcca45) | [v1.0.0](https://github.com/AureliusWu/ImageLore/releases/tag/v1.0.0) 已带已知限制发行；[发布清单](https://github.com/AureliusWu/ImageLore/releases/download/v1.0.0/release-manifest.json) 的构建来源为 d2cfc67ea402969b28c1ea1bba0a9148583cc696。 |
| 蜉蝣基金 / FundVal | [9bb78660431af549dc5ea144c05bc0306a452b1a](https://github.com/AureliusWu/FundVal/tree/9bb78660431af549dc5ea144c05bc0306a452b1a) | [v16.0.1](https://github.com/AureliusWu/FundVal/releases/tag/v16.0.1) 已带已知限制发行，发布来源 b0482be5d670adb5902aa662c099ac5310b9bee2；[线上版本脚本](https://aureliuswu.github.io/FundVal/js/version.js) 返回 16.0.1。 |
| 司南基金 / fund-compass | [a20c69a04f03ad8fc213f3e5acc1033ecebeab3d](https://github.com/AureliusWu/fund-compass/tree/a20c69a04f03ad8fc213f3e5acc1033ecebeab3d) | README 版本为 8.0.0，无正式 GitHub Release；[线上部署元数据](https://aureliuswu.github.io/fund-compass/release.json) 指向 80d01717faeb5a21cd1240ea6d8142e3320f5ae4。V9 为开发线。 |
| 全球新闻 / News | [4e4ea649b838a692b982089df3d2260347bb0cb4](https://github.com/AureliusWu/News/tree/4e4ea649b838a692b982089df3d2260347bb0cb4) | [v1.1.0](https://github.com/AureliusWu/News/releases/tag/v1.1.0) 已带已知限制发行；[线上元数据](https://aureliuswu.github.io/News/release.json) 报告同版，应用来源 20e630e20727dc3c243747c27b0101d9ac9e336e。 |

## 案例采用的事实

- **司忆：** 正式版改进任务队列、引导与中断恢复，默认模型检索限定在当前项目记忆。v17.0.0 的两个 Windows x64 安装包均未签名，发布说明记录了干净 Windows 的安装预检和实机验收缺口；不能将候选修补的行为算作正式包已验收。
- **ImageLore：** 关联生成图、提示词、修订和参考谱系，支持本地语义检索与可选视觉服务。v1.0.0 为未签名 Windows x64 安装器，采用手动更新。发行说明列出了已核对的升级路径和延期门禁，不能据此推断所有用户机器均完成验收。
- **蜉蝣基金：** [版本变更](https://github.com/AureliusWu/FundVal/blob/9bb78660431af549dc5ea144c05bc0306a452b1a/CHANGELOG.md) 记录按需 OCR、识别风险逐行确认、写入再核对、日期及来源区分和 PWA 更新保护。v16.0.1 补充 maskable 图标；物理设备、真实 Gist 同步和生产估值主源的缺口以正式发行说明为准。
- **司南基金：** [候选执行记录](https://github.com/AureliusWu/fund-compass/blob/a20c69a04f03ad8fc213f3e5acc1033ecebeab3d/docs/V9-EXECUTION-LOG.md) 记录私人会话、持久化和恢复的验收边界；[主线提交](https://github.com/AureliusWu/fund-compass/commit/a20c69a04f03ad8fc213f3e5acc1033ecebeab3d) 记录海外估值证据与校准边界。公开页面可达不能证明候选后端耐久性或私人流程通过。
- **全球新闻：** [发布交接](https://github.com/AureliusWu/News/blob/4e4ea649b838a692b982089df3d2260347bb0cb4/docs/V1.1.0_HANDOFF.md) 记录关注事件、命名筛选方案、分开备份与同代快照。轻量首页先展示新闻，完整数据按筛选和翻页需要读取。自动摘要与翻译保持关闭；[七天新鲜度与实体设备等门禁](https://github.com/AureliusWu/News/blob/4e4ea649b838a692b982089df3d2260347bb0cb4/docs/V1.1.0_RELEASE_WAIVERS.md) 属发布时豁免，不算验收通过。

后续录屏须来自对应版本的真实运行环境，使用无个人数据的示例。应用发布证据不能替代主页发布后的独立线上核对。
