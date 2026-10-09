# 念景 · Nianjing v0.2.0

**Turn a thought into a moving picture. / 把心里的话，做成会动的画。**

An open-source creative desk for everyday feelings, memories and travel wishes, with photography and drawing joined on warm paper.

给普通人的日常心情、回忆与旅行愿望一个创作入口，让摄影和绘画在温暖纸页上相遇。

## Chinese / English · 中英文双语

- Switch 中文 / EN without losing your original words, custom preferences, selected files or film.
- Create image, motion and music prompts; revise them in Chinese or English.
- Preview four existing Muse films, import your own video and music, and compose an MP4 locally.
- Replace the soundtrack while preserving the video picture.
- Configure your own Volcengine Ark or Vidu account, or create with a familiar website and import the result.
- No billing, recharge or subscription UI.

- 中文 / EN 切换保留原话、自定偏好、已选文件和作品。
- 组织画面、动态与音乐三类指令，支持中英文修改。
- 预览四段已有Muse短片，导入视频与音乐，在本地合成MP4。
- 可单独换配乐并保留视频画面。
- 可配置自己的火山方舟或Vidu账号，也可在熟悉的官网创作后导入。
- 项目不设收费、充值或订阅窗口。

## Use · 使用

Download and unzip `念景项目v0.2.0.zip`, or clone the repository. Use Node.js 22 or newer; FFmpeg and ffprobe are required for media validation and composition.

下载解压`念景项目v0.2.0.zip`，或克隆仓库。需要Node.js 22或更高版本；媒体检查及合成需要FFmpeg与ffprobe。

Run from the project folder / 在项目目录执行：

```sh
node 创作服务v1.1.mjs
```

Open / 打开：`http://127.0.0.1:8787/`。Use `?lang=en` or `?lang=zh` for a direct language link.

## Validation and limits · 验证与边界

All 13 local workflow tests passed, including bilingual behavior, offline adapter contracts and real FFmpeg music replacement. The GitHub Actions workflow runs on Node.js 22; see the repository's Actions tab for remote results.

本地13项流程测试通过，包括双语、离线适配器合同和真实FFmpeg配乐替换。GitHub Actions在Node.js 22运行，远程结果见仓库Actions页面。

The director uses editable rules, not a language model. The four films are existing Muse examples. Paid API generation and music quality have not been tested in a live account; no complete-film Muse / Hark API connection is claimed. The app runs locally and has not been deployed as a public online service.

创作导演使用可编辑规则，尚未接入语言模型。四段短片为已有Muse示例。付费API生成及音乐质量尚未在真实账号实测，未建立Muse / Hark完整短片API连接。应用在本地运行，尚未部署为公网在线服务。

Code, original documentation and prompts are MIT licensed. Sample images, videos and music are excluded from that grant. Private configuration, keys and local creations are excluded from the release ZIP.

代码、原创文档和提示词采用MIT许可；示例图片、视频与音乐不在此授权中。私有配置、Key与本地作品不进入发布ZIP。

[English README](../README.md) · [中文说明](中文说明v1.2.md)
