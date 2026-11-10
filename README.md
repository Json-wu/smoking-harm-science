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

## SEO / GEO

- `public/robots.txt`、`public/llms.txt`；sitemap 构建时生成
- 全站 Open Graph / Twitter Card、canonical、`hreflang=zh-CN`
- JSON-LD：`WebSite`、文章 `Article`、分类 `CollectionPage`、面包屑 `BreadcrumbList`
- 文章 Markdown 副本：`/blog/{slug}.md`（HTML `<head>` 中 `rel=alternate`）
- 小程序太阳码：`public/images/miniprogram/`
