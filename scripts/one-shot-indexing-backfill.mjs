#!/usr/bin/env node
/**
 * 一次性：从 dist/sitemap.xml 全量提交 IndexNow，并（若已配置）向 GSC 重新提交 sitemap。
 * 用法：npm run build && npm run indexnow:backfill
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { submitGscSitemap } from './lib/gsc-sitemap.mjs';
import { submitIndexNowUrls, siteHostFromEnv, indexNowKey } from './lib/indexnow-submit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = path.join(ROOT, 'dist/sitemap.xml');
const reportPath = path.join(ROOT, 'data/indexnow-backfill-last.json');

async function urlsFromSitemap(filePath) {
  const xml = await readFile(filePath, 'utf8');
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
}

function writeReport(payload) {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`[backfill] 报告已写入 ${reportPath}`);
}

async function main() {
  if (!existsSync(sitemapPath)) {
    console.error('[backfill] 未找到 dist/sitemap.xml，请先 npm run build');
    process.exit(1);
  }

  const urlList = await urlsFromSitemap(sitemapPath);
  if (urlList.length === 0) {
    console.error('[backfill] sitemap 中无 URL');
    process.exit(1);
  }

  const host = siteHostFromEnv();
  const key = indexNowKey();
  const startedAt = new Date().toISOString();

  console.log(
    `[backfill] 开始全量 IndexNow：host=${host} urls=${urlList.length} key=${key.slice(0, 8)}… mode=${process.env.INDEXNOW_MODE || 'both'}`,
  );
  console.log(
    '[backfill] 说明：提交记录请在 Bing Webmaster Tools → 报告 → IndexNow Insights 查看（非 indexnow.org）；站点须用与本站相同的 host 验证。',
  );

  const { ok: indexOk, report: indexReport } = await submitIndexNowUrls(urlList);
  if (!indexOk) {
    console.error('[backfill] IndexNow 全量提交存在失败项');
    process.exitCode = 1;
  } else {
    console.log(`[backfill] IndexNow 全量提交完成（${urlList.length} URL）`);
  }

  const gsc = await submitGscSitemap();
  if (gsc === false) {
    console.error('[backfill] GSC sitemap 提交失败');
    process.exitCode = 1;
  } else if (gsc === true) {
    console.log('[backfill] GSC sitemap 提交完成');
  }

  writeReport({
    startedAt,
    finishedAt: new Date().toISOString(),
    host,
    keyLocation: `https://${host}/${key}.txt`,
    urlCount: urlList.length,
    urls: urlList,
    indexNow: indexReport,
    gsc: gsc === true ? 'submitted' : gsc === 'skipped' ? 'skipped' : 'failed',
    bingWmtHint:
      'https://www.bing.com/webmasters — IndexNow Insights；host 须与 https://yan.aivelo.net 一致',
  });

  if (process.exitCode) process.exit(process.exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});