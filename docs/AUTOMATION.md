# 自动抓取与 CI/CD

## 抓取 → 中文写稿 → 审核

1. 稿源：国内 + 国外 RSS（见 `config/crawl-sources.json`）
2. **成稿语言**：标题、摘要、正文、标签须为**简体中文**；英文来源由 DeepSeek 写稿+审核时翻译/改写
3. 脚本另做中文占比校验，不合格不入库
4. 通过 → `src/content/blog/auto-*.md`；未通过 → `data/crawl-rejected.json`

## API Key

| 环境 | 配置 |
|------|------|
| GitHub Actions（定时/手动） | 仓库 **Secrets** → `DEEPSEEK_API_KEY`（必选，否则 workflow 失败） |
| 本地试跑 | 根目录 `.env` 填写 `DEEPSEEK_API_KEY`（`npm run crawl` 自动加载），或 `export` 后运行 |

可选：`DEEPSEEK_API_BASE`（默认 `https://api.deepseek.com`）

## GitHub Actions：`crawl.yml`

| 触发 | 说明 |
|------|------|
| `schedule` | 每周**二、四、六** **01:30 UTC**（北京时间 **09:30**） |
| `workflow_dispatch` | Actions 页手动「Run workflow」 |

流程：`npm run crawl`（每次最多 **1** 篇）→ 无新 RSS 素材则**不写稿、不写库、不 commit** → 有变更则 commit `auto-*.md` / 状态 JSON → **主动触发** `deploy.yml`（因 `GITHUB_TOKEN` 的 push 默认不会再触发其它 workflow）。

### 手动跑 crawl 成功但站上没有新文章？

1. 打开该次 **RSS crawl** 日志，看 **Crawl run summary**：
   - `"published": false` / `created: 0` → 没有新稿（RSS 已去重、未过审、或无命中素材），**属于正常绿勾**
   - `"published": true` → 应出现 **Commit crawl results** 的 commit，并出现 **Trigger Build and deploy**
2. 看 **Build and deploy** 是否成功、服务器是否已更新 `dist`
3. 仓库 `main` 上是否已有新的 `src/content/blog/auto-*.md`（没有则未生成或未 commit）

未过审记录见 Artifact 或 `data/crawl-rejected.json`。

### 为何连续两次 crawl 日志很像、还像写了同一篇？

1. **人民网 RSS 列表顺序固定**，且 WHO 等源里多数条目已在 `crawl-state.json` 去重，于是一轮里仍会先尝试同几条「边缘健康稿」（常审核不通过），最后才轮到同一篇「无烟日/戒烟」稿通过。
2. **未把 `crawl-state.json` 推回仓库**（或旧 workflow 只在新稿时才 commit）时，**未过审条目不会记下**，下次又会对同一条 RSS **重复写稿+审核**。
3. **同一 RSS 的 `slugHint` 每次会变**（模型随机），过去可能写出两篇后缀相同 id、文件名不同的 `auto-*-cd30dd8a.md`；现改为按 `stableId` 后缀识别已有文件，**不再重复生成**。

每次跑完应确保 **commit 含 `data/crawl-state.json`**（当前 workflow 在有任何 crawl 变更时都会提交）。

单次新发上限：`maxNewPerRun` = **1**。

每次运行另上传 **Artifact**（14 天保留），便于核对未过审记录。

## 本地与仓库关系

本地 `npm run crawl` 与 Actions 使用同一脚本；本地改完后照常 `git commit`。仓库定时任务会独立跑，可能与本地并行——以 `data/crawl-state.json` 去重，冲突时先 pull 再本地抓取。

```bash
export DEEPSEEK_API_KEY=sk-...
npm run crawl
npm run build
git add src/content/blog/auto-*.md data/crawl-state.json data/crawl-rejected.json
git commit -m "content: add reviewed auto articles"
git push
```

## 部署

`deploy.yml`：在 **push `main`** 时构建并部署（SSH 或 GitHub Pages，见 README）。
