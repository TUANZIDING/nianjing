# GitHub双语发布准备 v1.1

版本：0.2.0。状态：本地准备，未远程创建、推送或发布Release。

仓库候选：`TUANZIDING/nianjing`。显示名：`念景 · Nianjing`。

## About

English: Turn a thought into a moving picture. A bilingual creative desk for photo-and-paper collage films, music replacement and local export. Bring your own AI service.

中文：把心里的话，做成会动的画。支持中英文的纸上短片创作桌，摄影与绘画拼接、自选配乐、本地导出，自带第三方服务。

Topics: `creative-tools`, `ai-video`, `generative-art`, `image-to-video`, `music-generation`, `local-first`, `bilingual`.

## Release草案

Nianjing 0.2.0 adds Chinese / English interface and prompt output. Switch languages without losing your words, selected files or film. English ideas and revisions work with the rule-based director. Import creations from familiar services, replace music while preserving the picture, or configure your own official APIs. The project has no billing or recharge UI.

念景0.2.0增加中英文界面与指令输出，支持英文输入和修改。语言切换保留原话、已选文件和作品。使用熟悉的第三方创作并导入，可以单独换配乐、保留画面，也可配置自有官方API。项目不设收费或充值窗口。

能力边界 / Limits: The director is rule-based. Four films are existing Muse examples. API contracts are tested offline; paid generation and music quality await live verification. No complete-film Muse / Hark API connection is claimed. Example media rights are separate from the MIT code license.

## 发布包

双语README、中文说明、英文使用与贡献指南、双语提示词、两种语言实际界面截图、双语验证记录、当前1.1代码及保留的1.0快照。私有配置、真实Key、本地作品与Git内部文件排除。

标签候选：`v0.2.0`。发布时复核README两种语言入口、截图、视频链接、GitHub Actions及仓库可见性。当前仅本地测试，不能称为远程CI已通过。

远程操作仍是待执行草案：

```sh
gh repo create TUANZIDING/nianjing --public --source=. --remote=origin
git push -u origin HEAD:main
```
