import { execFileSync } from 'node:child_process';
import { blogFileToPublicUrl, siteOrigin } from './site-url.mjs';

const ZERO_SHA = '0000000000000000000000000000000000000000';

/**
 * 从 git 对比本次 push 变更的博客稿，生成对外 URL（用于 IndexNow / 收录通知）。
 */
export function getChangedBlogUrls({ before, after, origin = siteOrigin() }) {
  const head = after?.trim() || 'HEAD';
  let base = before?.trim();

  if (!base || base === ZERO_SHA) {
    try {
      base = execFileSync('git', ['rev-parse', `${head}~1`], { encoding: 'utf8' }).trim();
    } catch {
      return [];
    }
  }

  let files;
  try {
    files = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', base, head], {
      encoding: 'utf8',
    })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }

  const urls = [];
  for (const file of files) {
    const url = blogFileToPublicUrl(file, origin);
    if (url) urls.push(url);
  }

  return [...new Set(urls)];
}
