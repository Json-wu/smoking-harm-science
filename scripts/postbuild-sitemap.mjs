#!/usr/bin/env node
/**
 * Astro @astrojs/sitemap 默认输出 sitemap-index.xml + sitemap-0.xml；
 * 构建后合并为单一 /sitemap.xml（urlset），并删除分片与索引。
 */
import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const chunk = path.join(DIST, 'sitemap-0.xml');
const out = path.join(DIST, 'sitemap.xml');
const index = path.join(DIST, 'sitemap-index.xml');

if (!existsSync(chunk)) {
  console.error('[postbuild-sitemap] 未找到 dist/sitemap-0.xml，请先 npm run build');
  process.exit(1);
}

await copyFile(chunk, out);

for (const name of readdirSync(DIST)) {
  if (name === 'sitemap-index.xml' || /^sitemap-\d+\.xml$/.test(name)) {
    unlinkSync(path.join(DIST, name));
  }
}

console.log('[postbuild-sitemap] 已生成 dist/sitemap.xml，已移除 sitemap-index.xml 与 sitemap-*.xml 分片');
