# 自动抓取与 CI/CD

## 抓取 → 写稿 → 审核流程

1. 从 `config/crawl-sources.json` 拉取 RSS（含中文：WHO 中文新闻、人民网健康等）
2. 按 `keywordPatternZh` / `keywordPatternEn` 过滤
3. **DeepSeek 写稿**：根据标题、链接、摘要生成完整中文科普（JSON）
4. **DeepSeek 审核**：独立审查结构、来源数量、语气与分类；未通过写入 `data/crawl-rejected.json`
5. 通过后写入 `src/content/blog/auto-*.md`，并在 `data/crawl-state.json` 去重

## API Key

| 环境 | 配置 |
|------|------|
| GitHub Actions | 仓库 **Secrets** → `DEEPSEEK_API_KEY` |
| 本地 | 复制 `.env.example` 为 `.env`，然后 `export DEEPSEEK_API_KEY=sk-...` |

可选：`DEEPSEEK_API_BASE`（默认 `https://api.deepseek.com`）

本地试跑：

```bash
export DEEPSEEK_API_KEY=sk-...
npm run crawl
npm run build
```

## GitHub Actions

### `crawl.yml`

- 定时：每周一 01:30 UTC；支持手动触发
- 需 `DEEPSEEK_API_KEY` secret
- 自动提交 `auto-*.md`、`crawl-state.json`、`crawl-rejected.json`

### `deploy.yml`

- `main` 推送后构建并部署（SSH 或 GitHub Pages，见 README）

## 中文稿源

在 `config/crawl-sources.json` 中为源设置 `"lang": "zh"` 并使用中文 RSS。可按需增删 URL（须遵守对方服务条款）。

旧版 `brief-*` 摘要稿已不再生成；历史文件可手动删除。
