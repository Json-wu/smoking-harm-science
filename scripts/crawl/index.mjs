#!/usr/bin/env node
/**
 * 从 config/crawl-sources.json 中的 RSS 拉取与烟草/戒烟相关的公开资讯，
 * 生成 brief-* 摘要稿至 src/content/blog/（dedupe 见 data/crawl-state.json）。
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Parser from 'rss-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CONFIG_PATH = path.join(ROOT, 'config/crawl-sources.json');
const STATE_PATH = path.join(ROOT, 'data/crawl-state.json');
const BLOG_DIR = path.join(ROOT, 'src/content/blog');

const parser = new Parser({
  timeout: 30_000,
  headers: { 'User-Agent': 'smoking-harm-science-crawl/1.0 (+https://quitsmoking.aivelo.net)' },
});

function stableId(item, sourceId) {
  const raw = item.guid || item.id || item.link || `${sourceId}:${item.title}`;
  return createHash('sha256').update(String(raw)).digest('hex').slice(0, 16);
}

function matchesKeywords(text, pattern) {
  if (!pattern) return true;
  const re = new RegExp(pattern, 'i');
  return re.test(text);
}

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function yamlString(value) {
  return JSON.stringify(String(value ?? '').trim());
}

function formatDate(input) {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function buildMarkdown({ title, description, link, sourceLabel, pubDate }) {
  const excerpt = description || '暂无摘要，请访问原始来源阅读全文。';
  return `> 本文由定时任务从公开 RSS 收录，仅供科普导航；结论与数据请以原始来源为准。

**结论：** 以下为「${sourceLabel}」渠道的公开资讯摘要，便于追踪吸烟危害、烟草政策与戒烟研究动态；本站不对第三方页面内容作医学背书。

## 资讯摘要

${excerpt}

## 原始来源

1. ${title}. ${link}

## 实用建议

- 将摘要当作线索，阅读原文并核对发表机构、时间与研究设计。
- 若涉及个人戒烟或用药，请结合本地戒烟门诊与说明书，勿仅凭新闻标题做决定。
- 可将原文链接保存，便于与站内其它科普文章对照阅读。

## 参考文献与来源

1. ${sourceLabel}. ${title}. ${link}（访问日期：${pubDate}）
`;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  const state = JSON.parse(await readFile(STATE_PATH, 'utf8'));
  if (!state.ingested) state.ingested = {};

  let created = 0;
  const cap = config.maxNewPerRun ?? 5;

  for (const source of config.sources) {
    if (!source.enabled) continue;
    if (created >= cap) break;

    let feed;
    try {
      feed = await parser.parseURL(source.url);
    } catch (err) {
      console.error(`[crawl] 跳过源 ${source.id}：`, err.message);
      continue;
    }

    for (const item of feed.items ?? []) {
      if (created >= cap) break;

      const title = stripHtml(item.title || '').slice(0, 200);
      const link = (item.link || '').trim();
      if (!title || !link) continue;

      const blob = `${title} ${stripHtml(item.contentSnippet || item.content || item.summary || '')}`;
      if (!matchesKeywords(blob, config.keywordPattern)) continue;

      const id = stableId(item, source.id);
      if (state.ingested[id]) continue;

      const slug = `brief-${id}`;
      const filePath = path.join(BLOG_DIR, `${slug}.md`);
      if (await fileExists(filePath)) {
        state.ingested[id] = { slug, at: new Date().toISOString() };
        continue;
      }

      const description = stripHtml(item.contentSnippet || item.summary || item.content || title).slice(
        0,
        280,
      );
      const pubDate = formatDate(item.isoDate || item.pubDate);
      const body = buildMarkdown({
        title,
        description,
        link,
        sourceLabel: source.label,
        pubDate,
      });

      const tagList = ['资讯摘要', '自动收录', source.label];
      const tagsYaml = tagList.map((t) => `  - ${JSON.stringify(t)}`).join('\n');

      const frontmatter = `---
title: ${yamlString(title)}
description: ${yamlString(description)}
pubDate: ${pubDate}
category: ${yamlString(source.defaultCategory)}
tags:
${tagsYaml}
---

`;

      await writeFile(filePath, frontmatter + body, 'utf8');
      state.ingested[id] = { slug, at: new Date().toISOString(), source: source.id, link };
      created += 1;
      console.log(`[crawl] 新增 ${slug}.md ← ${source.id}`);
    }
  }

  state.updatedAt = new Date().toISOString();
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  console.log(`[crawl] 完成，本次新增 ${created} 篇。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
