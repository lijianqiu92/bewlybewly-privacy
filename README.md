# BewlyBewly 个人维护版

基于 [BewlyBewly/BewlyBewly](https://github.com/BewlyBewly/BewlyBewly) 的个人修改版，用于 Bilibili 界面优化。本项目由 lijianqiu92 独立维护，与原作者及 Bilibili 官方无关联。

当前版本：**0.41.3**。源码基于上游 v0.41.1，提交 `d42143547bf4e9cc6864f227fcbcbd396bbff25b`。保留原作者的 MIT 许可证和版权声明，详见 [LICENSE](LICENSE)。原项目说明见 [README-upstream.md](README-upstream.md)。

## 本版改动

0.41.3 优化悬停视频预览：复用正在进行的请求，同一页面只保留一个活动预览，移出卡片、切换页面或窗口失焦时停止预览并主动释放媒体资源。详见 [CHANGELOG.md](CHANGELOG.md)。

- 修复将“正在关注”作为首页时的重复加载和闪烁。
- 视频页默认宽屏，使用类似 YouTube 影院模式的布局；标题和 UP 主信息移到播放器下方。
- 播放器铺满页面宽度，并根据窗口高度预留标题和 UP 主信息空间；缩小页面两侧留白。
- 隐藏播放器下方的弹幕发送栏，将弹幕开关放到播放控制栏。
- 提前布局加载中的播放器骨架，缩小持续监听范围，避免弹幕更新频繁触发布局处理。
- 修复后台消息处理器注册时机和消息响应竞争。
- 深色模式调暗收起的进度条，控制栏显示时隐藏它；移除弹幕发送区遗留的白色分隔线。

## 在另一台电脑继续开发

```sh
git clone https://github.com/lijianqiu92/bewlybewly-privacy.git
cd bewlybewly-privacy
```

安装 Node.js 和项目声明的 pnpm 9.5.0，然后安装依赖并构建：

```sh
pnpm install --frozen-lockfile
npm run build
```

打开 `chrome://extensions`，启用开发者模式，通过“加载已解压的扩展程序”选择生成的 `extension` 目录。后续修改后重新构建，并在扩展页面重新加载。

需要继续交给 Codex 开发时，在 Codex 中打开克隆的文件夹，并让它先阅读 [PROJECT_NOTES.md](PROJECT_NOTES.md)。

## 隐私政策与发布

仓库最初用于托管隐私政策，现同时保存源码。原隐私政策文件及路径保持不变：[BewlyBewly-privacy.md](BewlyBewly-privacy.md)。

Chrome 商店版本通过现有私有条目分发；本仓库的可见性与商店分发范围分别设置。源码更新到 GitHub 后，仍需重新构建并向 Chrome 商店提交安装包，商店安装的版本才会自动更新。扩展本地设置和授权信息不随 Git 仓库同步。

生成上传包时，压缩 `extension` 目录内的文件，使 `manifest.json` 位于 ZIP 根目录，并随包保留原项目的 `LICENSE`。每次商店更新需要提高 `package.json` 中的版本号。
