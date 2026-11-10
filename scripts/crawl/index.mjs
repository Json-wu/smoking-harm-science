#!/usr/bin/env node
/**
 * RSS → DeepSeek 写稿 → DeepSeek 审核 → 通过后写入 src/content/blog/auto-*.md
 */
import { existsSync } from 'node:fs';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Parser from 'rss-parser';
import { deepseekChat, sleep } from './deepseek-client.mjs';
import { buildReviewMessages, buildWriteMessages } from './prompts.mjs';
import {
  fileExists,
  formatDate,
  isMostlyChinese,
  matchesKeywords,
  parseJsonFromModel,
  slugifySafe,
  stableId,
  stripHtml,
  yamlString,
} from './utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const ENV_PATH = path.join(ROOT, '.env');
if (existsSync(ENV_PATH)) {
  try {
    loadEnvFile(ENV_PATH);
  } catch (err) {
    console.warn('[crawl] 读取 .env 失败：', err.message);
  }
}

const CONFIG_PATH = path.join(ROOT, 'config/crawl-sources.json');
const STATE_PATH = path.join(ROOT, 'data/crawl-state.json');
const REJECTED_PATH = path.join(ROOT, 'data/crawl-rejected.json');
const LAST_RUN_PATH = path.join(ROOT, 'data/crawl-last-run.json');
const BLOG_DIR = path.join(ROOT, 'src/content/blog');

const VALID_CATEGORIES = new Set(['吸烟危害', '戒烟方法', '烟草知识']);

const parser = new Parser({
  timeout: 30_000,
  headers: { 'User-Agent': 'smoking-harm-science-crawl/2.0 (+https://yan.aivelo.net)' },
});

function requireApiKey() {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) {
    console.error(
      '[crawl] 需要 DEEPSEEK_API_KEY：在项目根目录 .env 填写，或执行 export DEEPSEEK_API_KEY=...',
    );
    process.exit(1);
  }
  return key;
}

function normalizeCategory(value, fallback) {
  return VALID_CATEGORIES.has(value) ? value : fallback;
}

async function loadJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeLastRun(summary) {
  await writeFile(LAST_RUN_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

async function emitGithubStepOutput(created, processed, stateDirtyFlag = false) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return;
  await appendFile(
    out,
    `created=${created}\nprocessed=${processed}\npublished=${created > 0 ? 1 : 0}\nstate_dirty=${stateDirtyFlag ? 1 : 0}\n`,
  );
}

async function finishRun({ created, processed, stateDirty }) {
  const summary = {
    created,
    processed,
    published: created > 0,
    stateDirty,
    at: new Date().toISOString(),
  };
  await writeLastRun(summary);
  await emitGithubStepOutput(created, processed, stateDirty);
  return summary;
}

async function writePostFile({ slug, title, description, pubDate, category, tags, body }) {
  const tagsYaml = (tags || []).map((t) => `  - ${JSON.stringify(String(t))}`).join('\n');
  const frontmatter = `---
title: ${yamlString(title)}
description: ${yamlString(description)}
pubDate: ${pubDate}
category: ${yamlString(category)}
tags:
${tagsYaml}
---

`;
  await writeFile(path.join(BLOG_DIR, `${slug}.md`), frontmatter + body.trim() + '\n', 'utf8');
}

async function main() {
  const apiKey = requireApiKey();
  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  const state = await loadJson(STATE_PATH, { version: 2, ingested: {} });
  const rejected = await loadJson(REJECTED_PATH, { items: [] });
  if (!state.ingested) state.ingested = {};

  const writeModel = config.deepseek?.writeModel || 'deepseek-chat';
  const reviewModel = config.deepseek?.reviewModel || 'deepseek-chat';
  const pauseMs = config.deepseek?.pauseMsBetweenCalls ?? 1200;

  let created = 0;
  let processed = 0;
  let stateDirty = false;
  const cap = config.maxNewPerRun ?? 1;

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

    const keywordPattern =
      source.lang === 'zh' ? config.keywordPatternZh : config.keywordPatternEn || config.keywordPatternZh;

    for (const item of feed.items ?? []) {
      if (created >= cap) break;

      const title = stripHtml(item.title || '').slice(0, 200);
      const link = (item.link || '').trim();
      if (!title || !link) continue;

      const excerpt = stripHtml(item.contentSnippet || item.summary || item.content || title).slice(0, 4000);
      const blob = `${title} ${excerpt}`;
      if (!matchesKeywords(blob, keywordPattern)) continue;

      const id = stableId(item, source.id);
      if (state.ingested[id]) continue;

      const pubDate = formatDate(item.isoDate || item.pubDate);
      const material = {
        sourceLabel: source.label,
        sourceLang: source.lang === 'en' ? 'en' : 'zh',
        title,
        link,
        pubDate,
        excerpt,
        suggestedCategory: source.defaultCategory,
      };

      processed += 1;
      console.log(`[crawl] 写稿 ${source.id}: ${title.slice(0, 60)}…`);

      let draft;
      try {
        const writeRaw = await deepseekChat({
          apiKey,
          model: writeModel,
          messages: buildWriteMessages(material),
        });
        draft = parseJsonFromModel(writeRaw);
      } catch (err) {
        console.error(`[crawl] 写稿失败 ${id}:`, err.message);
        continue;
      }

      await sleep(pauseMs);

      let review;
      try {
        const reviewRaw = await deepseekChat({
          apiKey,
          model: reviewModel,
          messages: buildReviewMessages(material, draft),
        });
        review = parseJsonFromModel(reviewRaw);
      } catch (err) {
        console.error(`[crawl] 审核失败 ${id}:`, err.message);
        continue;
      }

      await sleep(pauseMs);

      const approved = Boolean(review.approved);
      if (!approved) {
        console.warn(`[crawl] 未通过审核 ${id}:`, (review.issues || []).join('；') || '无详情');
        state.ingested[id] = {
          status: 'rejected',
          at: new Date().toISOString(),
          source: source.id,
          link,
        };
        stateDirty = true;
        rejected.items.push({
          id,
          at: new Date().toISOString(),
          source: source.id,
          title,
          link,
          issues: review.issues || [],
        });
        continue;
      }

      const finalTitle = String(review.title || draft.title || title).slice(0, 80);
      const finalDescription = String(review.description || draft.description || excerpt).slice(0, 160);
      const finalCategory = normalizeCategory(review.category || draft.category, source.defaultCategory);
      const finalTags = Array.isArray(review.tags) ? review.tags : draft.tags;
      const finalBody = String(review.bodyMarkdown || draft.bodyMarkdown || '').trim();
      if (!finalBody) {
        console.warn(`[crawl] 审核通过但正文为空，跳过 ${id}`);
        continue;
      }

      if (!isMostlyChinese(finalTitle) || !isMostlyChinese(finalBody, 40)) {
        console.warn(`[crawl] 未通过中文校验，跳过 ${id}`);
        state.ingested[id] = {
          status: 'rejected',
          at: new Date().toISOString(),
          source: source.id,
          link,
          reason: 'not_chinese',
        };
        stateDirty = true;
        rejected.items.push({
          id,
          at: new Date().toISOString(),
          source: source.id,
          title,
          link,
          issues: ['标题或正文非简体中文为主'],
        });
        continue;
      }

      const slugHint = slugifySafe(review.slugHint || draft.slugHint, '');
      const slug = slugHint ? `auto-${slugHint}-${id.slice(0, 8)}` : `auto-${id}`;

      if (await fileExists(path.join(BLOG_DIR, `${slug}.md`))) {
        state.ingested[id] = { slug, status: 'published', at: new Date().toISOString(), source: source.id, link };
        stateDirty = true;
        continue;
      }

      const tags = [...new Set([...(finalTags || []), '自动写稿', source.label])].slice(0, 8);

      await writePostFile({
        slug,
        title: finalTitle,
        description: finalDescription,
        pubDate,
        category: finalCategory,
        tags,
        body: finalBody,
      });

      state.ingested[id] = {
        slug,
        status: 'published',
        at: new Date().toISOString(),
        source: source.id,
        link,
        reviewed: true,
      };
      stateDirty = true;
      created += 1;
      console.log(`[crawl] 已发布 ${slug}.md ← ${source.id}`);
    }
  }

  if (processed === 0) {
    console.log('[crawl] 无新可处理条目，未调用写稿，未生成文章。');
    await finishRun({ created: 0, processed: 0, stateDirty: false });
    return;
  }

  if (stateDirty) {
    state.version = 2;
    state.updatedAt = new Date().toISOString();
    await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    await writeFile(REJECTED_PATH, `${JSON.stringify(rejected, null, 2)}\n`, 'utf8');
  }

  if (created === 0) {
    console.log('[crawl] 本次已处理素材但未生成新文章（未通过审核或已达上限前失败）。');
  } else {
    console.log(`[crawl] 完成，本次新发布 ${created} 篇。`);
  }
  await finishRun({ created, processed, stateDirty });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
