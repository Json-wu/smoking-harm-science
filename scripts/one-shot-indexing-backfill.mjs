#!/usr/bin/env node
/**
 * 一次性：从 dist/sitemap.xml 全量提交 IndexNow，并（若已配置）向 GSC 重新提交 sitemap。
 * 用法：npm run build && npm run indexnow:backfill
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { submitGscSitemap } from './lib/gsc-sitemap.mjs';
import { submitIndexNowUrls, siteHostFromEnv, indexNowKey } from './lib/indexnow-submit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = path.join(ROOT, 'dist/sitemap.xml');

async function urlsFromSitemap(filePath) {
  const xml = await readFile(filePath, 'utf8');
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
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
  console.log(
    `[backfill] 开始全量 IndexNow：host=${host} urls=${urlList.length} key=${key.slice(0, 8)}…`,
  );

  const indexOk = await submitIndexNowUrls(urlList);
  if (!indexOk) {
    console.error('[backfill] IndexNow 全量提交失败');
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

  if (process.exitCode) process.exit(process.exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});