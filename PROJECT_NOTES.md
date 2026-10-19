# 开发交接记录

## 当前状态

- 个人维护版 0.41.3，基于上游 0.41.1。
- 0.41.3 是正式构建，已移除临时性能诊断脚本、选项页面和预览诊断事件。0.41.2 的 r4 为之前版本的最终本地修订。
- 用户已确认影院布局、弹幕开关和白线修正有效。最终包是否已经在 Chrome 商店发布，需以开发者控制台为准。
- 此仓库不会同步原 Codex 对话历史，本文记录后续开发所需的关键背景。

## 关键文件

- `src/contentScripts/views/Home/components/Following.vue`：移除首页初始加载中按“没有滚动条”递归预取下一批内容的逻辑，避免闪烁。
- `assets/video-theater-preload.js`：document_start 提前给根元素添加影院布局标记，避免加载骨架先显示普通布局。
- `src/contentScripts/videoTheaterSetup.ts`：播放器发现、原生宽屏切换、页面导航和窗口宽度监听。加载到视频数据后才触发原生宽屏切换；就绪后只监听必要容器，避免弹幕节点更新反复触发。
- `src/contentScripts/videoTheater.ts`：在原生播放控制栏插入弹幕开关，通过原始 checkbox 的 `input.click()` 调用原生逻辑。原始 label 没有 `for`，直接点 label 不生效。
- `src/styles/videoTheater.scss`：影院布局、标题与 UP 主信息位置、播放器高度上限、弹幕栏隐藏和深色进度条样式。
- `src/manifest.ts`：提前布局脚本注册，以及图标路径修正。
- `src/background/messageListeners/api/index.ts`、`tabs.ts`、`src/background/utils.ts`：后台启动时同步注册消息处理器；未匹配的消息直接返回 undefined，避免不同处理器争抢响应。
- `src/components/VideoCard/VideoCard.vue`、`previewPlayback.ts`：0.41.3 的悬停预览修正。页面内预览互斥；未完成请求复用；过期响应不再挂载视频；鼠标离开、窗口失焦、页面隐藏、组件停用或卸载时释放媒体资源。

## 间歇卡顿调查

用户在关注首页和播放页遇到数秒到二十多秒的交互停顿。关闭 ChatGPT 浏览器接管扩展后仍然复现，不能将其认定为唯一原因。性能记录中关注首页出现约 10、22、23 秒的事件循环间隔，但相应页面最长脚本任务仅约 96 毫秒；未确定浏览器原生媒体管线或 GPU 层面的具体根因。

用户发现悬停卡片触发视频预览时更易复现。修复了预览请求与资源生命周期问题后，用户反馈目前暂未发现问题并同意发布。已完成请求去重、晚响应丢弃、预览互斥、媒体卸载和失焦停止的模拟检查、代码检查、类型检查及构建；没有将短期观察描述为已经证明所有卡顿根因均已消除。

## 白线的真实来源

实际检查确认是 Bilibili 原生 `.bpx-player-sending-area::before`，样式为 `height: 1px; background: #f4f4f4`。只隐藏 `.bpx-player-sending-bar` 不会移除这个伪元素。影院模式下用 `content: none` 和 `display: none` 隐藏它。

曾尝试调整进度条、移除播放器外框/占位层阴影，均不能解决该白线；最终撤回了后者的无关改动。不要再次将白线误判为播放器外框。

## 构建与检查

使用 `npm run build` 生成生产版。项目声明 pnpm 9.5.0，使用 `pnpm install --frozen-lockfile` 安装依赖。

本轮修改文件的 ESLint 检查、全项目 `npm run typecheck` 和生产构建已通过。构建会出现上游保留的 broken-image 资源路径和 UnoCSS 提示。没有对最终整包运行全量浏览器回归，也未量化首播耗时；不要将用户曾反馈的 8–10 秒延迟描述为已完成性能测量。

重新加载开发版扩展后，旧页面可能报 `Extension context invalidated`。刷新原有 B 站页面并清理旧错误记录后，再判断是否存在新的运行错误。

## 仓库管理

保留根目录的 `BewlyBewly-privacy.md`，商店隐私政策链接指向该文件。原项目的自动发布工作流和 `.release-it.json` 没有导入，当前使用手动构建与商店更新流程。不要将浏览器配置、授权信息、私钥、node_modules 或生成的 extension 目录提交到仓库。
