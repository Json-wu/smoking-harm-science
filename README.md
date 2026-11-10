# smoking-harm-science

吸烟危害与戒烟科普站，整理香烟相关的公开知识与研究资料，帮助想戒烟的人了解烟草的真实影响。

**正式域名：** [https://quitsmoking.aivelo.net](https://quitsmoking.aivelo.net)

## 技术栈

- [Astro](https://astro.build/) 静态站点
- Tailwind CSS
- 文章：`src/content/blog/*.md`

## 本地开发

```bash
npm install
npm run dev
```

生产构建与预览：

```bash
npm run build
npm run preview
```

构建默认使用 `https://quitsmoking.aivelo.net` 作为 `site`（canonical、sitemap）。如需覆盖：

```bash
SITE_URL=https://quitsmoking.aivelo.net npm run build
```

## 内容

- 科普文章 **40 篇**，位于 `src/content/blog/`（吸烟危害 / 戒烟方法 / 烟草知识）
- 首页 `/`：介绍 + 最新文章 + 小程序入口
- 关于 `/about/`、分类 `/category/{harm|methods|knowledge}/`、小技巧 `/tips/`
- 左右分栏阅读，侧栏支持关键词搜索与分类快捷筛选

## 自动抓取与部署

| 命令 / 工作流 | 作用 |
|---------------|------|
| `npm run crawl` | 中文/英文 RSS → DeepSeek 写稿 + 审核 → `auto-*.md`（需 `DEEPSEEK_API_KEY`） |
| `.github/workflows/crawl.yml` | **每周一 09:30（北京时间）** 定时写稿；支持手动触发；有新稿则自动 commit → 触发部署 |
| `.github/workflows/deploy.yml` | `main` 推送后构建并部署 |

**部署（二选一）**

1. **SSH / rsync（默认）** — 在仓库 Secrets 配置：`SSH_PRIVATE_KEY`、`SSH_HOST`、`SSH_USER`、`DEPLOY_PATH`（服务器上静态目录）。  
2. **GitHub Pages** — 仓库 Variables 设置 `USE_GITHUB_PAGES=true`，并在仓库 Pages 里选用 `gh-pages` 分支；`public/CNAME` 已含 `quitsmoking.aivelo.net`。

在 GitHub **Settings → Secrets** 配置 `DEEPSEEK_API_KEY`。国外 RSS 成稿也须为**简体中文**（DeepSeek 写稿+审核+脚本校验）。抓取状态见 `data/crawl-state.json`，未通过见 `data/crawl-rejected.json`。

**定时抓取前提**：在仓库 **Settings → Secrets** 配置 `DEEPSEEK_API_KEY`（Actions 未配置则定时任务会失败）。单次最多新发 `maxNewPerRun` 篇（默认 2，见 `config/crawl-sources.json`）。本地试跑仍可用 `npm run crawl`，自行 commit。

## SEO / GEO

- `public/robots.txt`、`public/llms.txt`；sitemap 构建时生成
- 全站 Open Graph / Twitter Card、canonical、`hreflang=zh-CN`
- JSON-LD：`WebSite`、文章 `Article`、分类 `CollectionPage`、面包屑 `BreadcrumbList`
- 文章 Markdown 副本：`/blog/{slug}.md`（HTML `<head>` 中 `rel=alternate`）
- 小程序太阳码：`public/images/miniprogram/`
