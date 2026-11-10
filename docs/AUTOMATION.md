# 自动抓取与 CI/CD

## 抓取流程

1. `scripts/crawl/index.mjs` 拉取 RSS（`rss-parser`）
2. 按 `keywordPattern` 过滤烟草/戒烟相关条目
3. 以 `brief-{hash}.md` 写入 `src/content/blog/`，frontmatter 符合 `src/content/config.ts`
4. `data/crawl-state.json` 记录已收录 id，避免重复

本地试跑：

```bash
npm run crawl
npm run build
```

## GitHub Actions

### `crawl.yml`

- **定时**：`30 1 * * 1`（每周一 UTC）
- **手动**：Actions → RSS crawl → Run workflow
- 有变更时自动提交 `brief-*.md` 与 `crawl-state.json`

### `deploy.yml`

- **触发**：推送到 `main`、手动 workflow
- **构建**：`SITE_URL=https://quitsmoking.aivelo.net npm run build`
- **部署**：
  - 未设置 `USE_GITHUB_PAGES` 时走 SSH rsync（需 Secrets）
  - `USE_GITHUB_PAGES=true` 时发布到 `gh-pages` 分支

`crawl` 提交会再次触发 `deploy`，形成「抓取 → 构建 → 上线」闭环。

## 运维检查清单

- [ ] Secrets / Variables 已配置
- [ ] 域名 DNS 指向托管（服务器或 GitHub Pages）
- [ ] 首次部署后核对 `https://quitsmoking.aivelo.net/sitemap-index.xml`
- [ ] 抽查 `brief-*` 摘要稿是否与站点定位一致，必要时在 config 收紧关键词或关掉某 RSS 源
