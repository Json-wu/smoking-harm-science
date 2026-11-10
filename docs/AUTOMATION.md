# 自动抓取与 CI/CD

## 抓取 → 中文写稿 → 审核

1. 稿源：国内 + 国外 RSS（见 `config/crawl-sources.json`）
2. **成稿语言**：标题、摘要、正文、标签须为**简体中文**；英文来源由 DeepSeek 写稿+审核时翻译/改写
3. 脚本另做中文占比校验，不合格不入库
4. 通过 → `src/content/blog/auto-*.md`；未通过 → `data/crawl-rejected.json`

## API Key

| 环境 | 配置 |
|------|------|
| 本地（推荐） | `export DEEPSEEK_API_KEY=...` 后 `npm run crawl` |
| Actions 手动跑 | Secret `DEEPSEEK_API_KEY`；结果在 **Artifacts**，不写回仓库 |

## 版本管理（人工提交）

**不会**自动 `git commit` / push。请你审阅新生成的 `auto-*.md` 与 `data/crawl-state.json` 后自行提交。

```bash
export DEEPSEEK_API_KEY=sk-...
npm run crawl
npm run build
git add src/content/blog/auto-*.md data/crawl-state.json data/crawl-rejected.json
git commit -m "content: add reviewed auto articles"
git push
```

## 部署

`deploy.yml`：仅在 **push `main`** 时构建并部署（仍需配置 SSH 或 GitHub Pages）。
