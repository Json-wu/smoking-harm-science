import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';

export function stableId(item, sourceId) {
  const raw = item.guid || item.id || item.link || `${sourceId}:${item.title}`;
  return createHash('sha256').update(String(raw)).digest('hex').slice(0, 16);
}

export function matchesKeywords(text, pattern) {
  if (!pattern) return true;
  const re = new RegExp(pattern, 'i');
  return re.test(text);
}

export function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function yamlString(value) {
  return JSON.stringify(String(value ?? '').trim());
}

export function formatDate(input) {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function slugifySafe(input, fallback) {
  const base = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || fallback;
}

/** 标题/正文须以简体中文为主（读者全中文） */
export function isMostlyChinese(text, minChars = 8) {
  const s = String(text || '').trim();
  if (!s) return false;
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  if (cjk < minChars) return false;
  return cjk / s.length >= 0.2;
}

export function parseJsonFromModel(text) {
  const raw = String(text).trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1].trim() : raw;
  return JSON.parse(candidate);
}
