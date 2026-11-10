#!/usr/bin/env node
/**
 * IndexNow：通知 Bing 等搜索引擎 URL 已更新。
 * @see https://www.indexnow.org/documentation
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { submitIndexNowUrls, siteHostFromEnv, indexNowKey } from './lib/indexnow-submit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function urlsFromSitemap(filePath) {
  const xml = await readFile(filePath, 'utf8');
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
}

function parseCliUrls(argv) {
  const urls = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--urls' && argv[i + 1]) {
      urls.push(argv[++i]);
      continue;
    }
    if (argv[i].startsWith('http://') || argv[i].startsWith('https://')) {
      urls.push(argv[i]);
    }
  }
  return urls;
}

async function main() {
  let urlList = parseCliUrls(process.argv.slice(2));
  const sitemapPath = path.join(ROOT, 'dist/sitemap.xml');

  if (urlList.length === 0) {
    if (!existsSync(sitemapPath)) {
      console.error('[indexnow] 未指定 URL，且没有 dist/sitemap.xml。请先 npm run build。');
      process.exit(1);
    }
    urlList = await urlsFromSitemap(sitemapPath);
  }

  const ok = await submitIndexNowUrls(urlList);
  if (!ok) process.exit(1);

  const host = siteHostFromEnv();
  const key = indexNowKey();
  console.log(`[indexnow] host=${host} keyLocation=https://${host}/${key}.txt 合计 ${urlList.length} URL`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
