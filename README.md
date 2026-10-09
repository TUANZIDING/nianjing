# 念景 · Nianjing

**English** · [简体中文](文档/中文说明v1.1.md)

**Turn a thought into a moving picture.**

A warm, paper-inspired creative desk for everyday expression. Start with a feeling, a memory or a place you long to see. Bring photography and drawing together in a short film, with music that feels like you.

![Nianjing in English](文档/英文创作桌预览v1.0.jpg)

One sentence → Collage image → Motion → Music → Compose & export → Refine.

**v0.2.0 · Chinese / English.** Switch between 中文 and EN on the desk. Your original words, selected files and existing film stay in place. Interface text and rule-based prompts change language; your own words and custom preferences are not machine-translated.

## What you can do

- Start without a reference photo or prompting skills.
- Create image, motion and music prompts from Chinese or English ideas.
- Choose the paper style, collage layout, aspect ratio and a 5- or 10-second generation target.
- Preview four existing Muse films with audio.
- Import video and music, preserve the video picture, and export a composed MP4 locally.
- Refine prompts in either language. Replace only the music while keeping the picture.
- Configure your own Volcengine Ark or Vidu account, or use a familiar website and import the result.

Nianjing has **no billing, recharge or subscription window**. External generation uses your own provider account. Listed services are candidates, not claimed partners.

## Start locally

Use Node.js 22 or newer. FFmpeg and ffprobe are needed for media validation and composition; prompt creation and example browsing work without them. Local validation used Node.js 25.4.0. The Node.js 22 CI workflow is prepared but has not run on GitHub.

```sh
cd 念景
node 创作服务v1.1.mjs
```

Open the [English creative desk](http://127.0.0.1:8787/?lang=en) or the [Chinese creative desk](http://127.0.0.1:8787/?lang=zh). There are no npm dependencies or frontend CDNs.

The language choice is saved locally. An explicit `?lang=en` or `?lang=zh` link takes priority; otherwise the desk uses your saved choice or browser language. Code files ending in v1.1 are the current entry points; v1.0 files remain as the first-release snapshot.

Install FFmpeg from its [official download page](https://ffmpeg.org/download.html), and make both `ffmpeg` and `ffprobe` available in your terminal. On a Mac with Homebrew installed, use `brew install ffmpeg`.

If the default port is busy:

```sh
NIANJING_PORT=8788 node 创作服务v1.1.mjs
```

## Two ways to create

| Mode | Workflow | Verified status |
| --- | --- | --- |
| Muse, Hark or another website | Write an idea → copy prompts → create externally → import files → compose locally | Import, composition and download tested. No automatic messages sent to external chats. |
| Your own official API | Configure image and video models → generate a collage → generate motion and optional music → compose | Adapters and offline workflows implemented; paid generation has not been tested. |

The director uses **editable rule-based templates**, with six scene categories; it is not a language model. The four sample films are existing user-provided Muse works, not new Nianjing output. No complete-film Muse or Hark API connection has been established. Model access, quality, latency and billing need live verification in your account.

Without separate music, the video keeps its own soundtrack. A silent video is clearly labeled; import audio later to add music. Switching interface language does not submit a new generation request.

## Bring your own API

```sh
mkdir -p 私有
cp 服务配置示例v1.0.json 私有/服务配置v1.0.json
```

Set `imageProvider` and `videoProvider` to `vidu` or `volcano`. Set `audioProvider` to `vidu` or `external`. Add your API key and model IDs already enabled in your account, then restart.

Keys are read only by the local server; the browser receives readiness flags. Private configuration and local creations are excluded from Git. Environment variables `VIDU_API_KEY` and `VOLCENGINE_API_KEY` override file keys; `NIANJING_CONFIG` sets a custom configuration path.

Vidu's image model must support text-to-image without a reference. Its video model must support the chosen duration and audio parameters. Ark's first-frame video uses `ratio=adaptive`; image size must match the model. Separate Vidu music and account access still await live testing. See the [English setup and contribution guide](文档/English-guidev1.0.md) or [Chinese extension guide](文档/扩展服务指南v1.0.md).

## Four pages of inspiration

These are existing Muse examples. Their music provenance and commercial rights have not been independently reviewed; see the [asset notice](文档/English-guidev1.0.md#assets-and-license).

| Lantern Reverie | A Light in the Snow |
| --- | --- |
| ![Lantern town](示例/灯笼古镇v1.0.webp) | ![Snowy cabin](示例/雪山木屋v1.0.webp) |
| [Watch the 10-second film](示例/灯笼古镇v1.0.mp4) | [Watch the 10-second film](示例/雪山木屋v1.0.mp4) |
| **A Tide of Quiet** | **An Autumn Pause** |
| ![Ocean sunset](示例/日落海浪v1.0.webp) | ![Autumn forest](示例/秋日森林v1.0.webp) |
| [Watch the 10-second film](示例/日落海浪v1.0.mp4) | [Watch the 10-second film](示例/秋日森林v1.0.mp4) |

The [bilingual creative guide](提示词/创作指南v1.1.md) includes **My Mind Left Class Early**: a gently satirical classroom idea where lecture notes become paper planes. It is a prompt example, not a generated film.

## Check and contribute

```sh
node --test 验证/流程验证v1.1.mjs
node 验证/交付检查v1.0.mjs
```

Tests cover both languages, English revisions, language-safe project data, provider contracts, failures, sample integrity, real FFmpeg music replacement, and HTTP import/export. No paid generation is requested. See the [bilingual delivery record](文档/双语核验v1.0.md).

Contributions can add verified adapters, official service links and confirmed collaboration entries. Keep model facts dated, test contracts offline, and distinguish implemented code from live generation. Do not commit keys, private tasks or unpublished user content. See the [English guide](文档/English-guidev1.0.md).

Source code, original documentation and prompts use the [MIT License](LICENSE). Example images, videos and music are outside that grant. The server listens only on `127.0.0.1`; public multi-user hosting needs separate authentication, usage controls and task isolation. This release is prepared locally and has not been pushed to GitHub or deployed publicly.

---

**把心里的话，做成会动的画。** [阅读完整中文说明 →](文档/中文说明v1.1.md)

![念景中文界面](文档/中文创作桌预览v1.0.jpg)
