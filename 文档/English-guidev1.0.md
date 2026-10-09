# Nianjing setup & contribution guide v1.0

[English README](../README.md) · [中文说明](中文说明v1.1.md)

## Create and refine

Run `node 创作服务v1.1.mjs` from the project folder. The desk supports Chinese and English. Select 中文 / EN, or open a link with `?lang=zh` / `?lang=en`. The choice is remembered; an explicit URL takes priority over the saved choice.

Write your idea in either language. Optional preferences control mood, music, layout, frame and paper style. The rule-based director recognizes six scene groups: classroom, canal, snowy cabin, forest, ocean and a general scene. The three prompts share a connecting object and one creative intention.

With no API configured, copy the prompts to a service you use. Bring back a video and, optionally, a collage image or separate music. Video/audio files may be up to 100 MB each; images up to 15 MB. Media duration is limited to 180 seconds. Images must be PNG, JPEG or WebP.

Composition preserves the video stream and replaces its entire audio track if separate music is supplied. Music fades in and out; short audio is padded with silence and long audio is trimmed to the video length. Original dialogue and environmental sound are also replaced. The tool does not loop music, time-stretch it or automatically compose a longer score.

English changes such as “make the music softer,” “use a side-by-side layout,” or “make it 5 seconds” update the prompts. A music-only change can generate separate audio when configured; a picture change requires starting a new film from the updated idea. Updating prompts does not itself change existing media.

Switching language preserves the original idea, custom preferences, selected file inputs and media. It translates interface copy and the director's templates, not user-authored text. Third-party websites retain their own language support. Browser-owned controls, such as file-picker captions, follow the browser or operating-system language.

## Configure providers

Copy `服务配置示例v1.0.json` to `私有/服务配置v1.0.json`. The private folder and `本地作品/` output folder are Git-ignored.

| Setting | Supported values |
| --- | --- |
| imageProvider | vidu, volcano, external |
| videoProvider | vidu, volcano, external |
| audioProvider | vidu, external |

Configure both image and video before using direct generation. Audio is optional. Add your own `apiKey` and enabled `imageModel`, `videoModel` and optional `audioModel` IDs. Keys never reach the browser. Environment variables `VIDU_API_KEY` and `VOLCENGINE_API_KEY` override file keys. `NIANJING_CONFIG` can point to another local configuration file.

Ark defaults to 2K images and 720p video, using adaptive ratio for first-frame animation. Vidu defaults to 1080p images/video. Select models supporting the parameters and the chosen 5/10-second duration. `nativeAudio` is false by default; enable only on supported video models. With separate music enabled, leaving native audio off usually makes later replacement simpler.

This release does not select or enable models for you, query your balance, or automatically retry paid tasks. A readiness flag means configuration exists, not that account access or generation quality has been verified. If a task times out, check the provider console and saved task ID before submitting again.

Official provider contracts were reviewed on 2026-10-09. Volcengine image/video and Vidu image/video/text-to-audio adapters are implemented and tested offline. No paid generation has been attempted. Vidu music quality, live response types, current account access and migration-era documentation differences remain to be tested. See the [official-contract review in Chinese](生成接口核验v1.0.md).

## Extend a service

The adapter interface lives in `核心/生成接口v1.0.mjs`:

```js
const provider = createProvider(config);
const result = await provider.generate(kind, plan, {image, onTask});
// kind: image / video / audio
// image: first-frame URL or data URI for video
// result: {url} or {bytes: Buffer}; a task ID is not a finished film
```

An adapter owns authentication, model-specific parameters, asynchronous states, result URLs and safe error messages. The caller handles download limits, media checks, local saving and composition. Keep keys and raw account-sensitive provider errors out of browser output.

Review official documentation and record the date. Add capability-specific readiness checks and offline contract tests through injected transport. Do not call billing APIs in CI. A live test needs the account owner's authorization; record the model, duration, resolution and observed quality without storing keys.

Keep interface strings in `核心/语言词典v1.0.mjs` with both Chinese and English text. Add template language logic in `核心/创作导演v1.1.mjs`. Preserve existing input values, task IDs and media when changing language. Newly named files use readable names with a version and extension, and no underscores; fixed GitHub entry names follow their platform convention.

Service listings are candidates, not partnership claims. Add an actual collaboration entry only with a verified official link and an accurate relationship status. The project does not automatically contact vendors or send user information.

## Assets and license

Code, original documentation and prompts are under [MIT](../LICENSE). The four sample images, videos and their audio come from the project owner's existing Muse work and are outside that grant. Their provenance and commercial rights have not been independently reviewed. Do not infer redistribution, commercial use or original ownership from their presence in this example package.

Sample hashes and media checks are recorded in [the source manifest](../示例/素材来源v1.0.json). Existing examples do not demonstrate Nianjing API quality or live generation success.

## Hosting boundary

The server binds only to 127.0.0.1. It serves registered examples and project assets, checks request origins for writes, and keeps secrets server-side. It is a local tool. Public hosting needs separate authentication, usage limits, task isolation and network/download policies; GitHub Pages cannot run this Node and FFmpeg workflow.
