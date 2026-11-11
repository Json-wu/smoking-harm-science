# 部署后收录通知（IndexNow + Google Search Console）

## 流程

1. **定时/手动抓取**（`crawl.yml`）生成 `auto-*.md` 并 push `main`
2. **Build and deploy**（`deploy.yml`）构建、部署静态站
3. **部署成功后**运行 `scripts/post-deploy-index.mjs`：
   - 用 `github.event.before` → `github.sha` 对比，找出**新增/修改**的 `src/content/blog/*.md`
   - 将对应 `https://yan.aivelo.net/blog/{slug}/` 提交 **IndexNow**
   - 若配置了 GSC 服务账号，向 Search Console **重新提交** `sitemap.xml`（便于 Google 发现新链）

无博客稿变更的 push（如只改样式）**不会**发收录通知。

## 访问统计（GTM / GA4）

全站通过 **Google Tag Manager**（`GTM-P569LFD9`，见 `src/lib/site.ts`）加载；**GA4 衡量 ID 请在 [GTM 后台](https://tagmanager.google.com/) 添加「Google Analytics: GA4 配置」标签**并发布容器，无需在页面再单独贴 `gtag.js`。

- **生产**（`npm run build` / deploy）默认注入 GTM
- **本地 dev** 默认不加载；需调试时设 `PUBLIC_GTM_ENABLE=1`
- 换容器：环境变量 `PUBLIC_GTM_ID` 覆盖默认 ID

## IndexNow

- 密钥文件：`public/702ac6e18573440ab2262eaca1147090.txt`
- 全量（本地）：`npm run build && npm run indexnow`
- 指定 URL：`npm run indexnow -- https://yan.aivelo.net/blog/foo/`

## Google Search Console（sitemap 再提交）

普通博客页**不能**使用 [Indexing API](https://developers.google.com/search/apis/indexing-api/v3/using-api)（仅职位/直播等受限类型）。本站采用 **Search Console API 重新提交 sitemap**，让 Google 拉取最新 URL 列表。

### 一次性配置

1. [Google Cloud](https://console.cloud.google.com/) 创建项目，启用 **Google Search Console API**
2. 创建**服务账号**，下载 JSON 密钥
3. [GSC](https://search.google.com/search-console) → **设置 → 用户和权限**，把服务账号的 `client_email` 加为** owner（完全）**
4. GitHub 仓库 **Secrets** 新增 `GOOGLE_SERVICE_ACCOUNT_JSON`，值为**整份 JSON 单行粘贴**（不要提交到 git）

未配置该 Secret 时，仅 IndexNow 会执行，GSC 步骤自动跳过。

## 手动试跑（与 CI 相同逻辑）

```bash
export SITE_URL=https://yan.aivelo.net
export GITHUB_BEFORE="$(git rev-parse HEAD~1)"
export GITHUB_SHA="$(git rev-parse HEAD)"
# 可选：export GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
node scripts/post-deploy-index.mjs
```
