#!/usr/bin/env node
/**
 * 部署完成后：对本次变更的博客 URL 通知 IndexNow，并在已配置时向 GSC 重新提交 sitemap。
 */
import { getChangedBlogUrls } from './lib/changed-public-urls.mjs';
import { submitGscSitemap } from './lib/gsc-sitemap.mjs';
import { submitIndexNowUrls } from './lib/indexnow-submit.mjs';
import { siteOrigin } from './lib/site-url.mjs';

async function main() {
  const before = process.env.GITHUB_BEFORE;
  const after = process.env.GITHUB_SHA || 'HEAD';

  const changedUrls = getChangedBlogUrls({ before, after, origin: siteOrigin() });

  if (changedUrls.length === 0) {
    console.log('[post-deploy-index] 本次 push 无新增/修改博客稿，跳过收录通知');
    return;
  }

  console.log('[post-deploy-index] 变更 URL:', changedUrls.join(', '));

  const indexOk = await submitIndexNowUrls(changedUrls);
  if (!indexOk) process.exitCode = 1;

  const gsc = await submitGscSitemap();
  if (gsc === false) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
