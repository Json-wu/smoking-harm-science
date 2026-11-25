#!/usr/bin/env node
/**
 * 冒烟测试：线上密钥文件、IndexNow API、GSC sitemap API 是否可达。
 */
import { submitGscSitemap } from './lib/gsc-sitemap.mjs';
import { submitIndexNowUrls, siteHostFromEnv, indexNowKey } from './lib/indexnow-submit.mjs';
import { siteOrigin } from './lib/site-url.mjs';

const KEY_CHECK_TIMEOUT_MS = 15_000;

async function checkKeyFileOnSite() {
  const host = siteHostFromEnv();
  const key = indexNowKey();
  const url = `https://${host}/${key}.txt`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), KEY_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const body = (await res.text()).trim();
    if (res.status !== 200) {
      return { ok: false, detail: `HTTP ${res.status}` };
    }
    if (body !== key) {
      return { ok: false, detail: '密钥文件内容与 INDEXNOW_KEY 不一致' };
    }
    return { ok: true, detail: url };
  } catch (err) {
    return { ok: false, detail: err?.message || String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function checkIndexNowApi() {
  const origin = siteOrigin();
  const ok = await submitIndexNowUrls([`${origin}/`]);
  return { ok, detail: ok ? 'api.indexnow.org 接受提交' : 'API 返回非 200/202' };
}

async function checkGscPath() {
  const hasCreds = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
  if (!hasCreds) {
    return { ok: null, detail: '未配置 GOOGLE_SERVICE_ACCOUNT_JSON（跳过，非失败）' };
  }
  const result = await submitGscSitemap();
  if (result === 'skipped') {
    return { ok: null, detail: 'JSON 无效或未配置，已跳过' };
  }
  return {
    ok: result === true,
    detail: result === true ? 'Search Console API 已重新提交 sitemap' : 'API 调用失败',
  };
}

function printRow(name, { ok, detail }) {
  const icon = ok === true ? 'PASS' : ok === false ? 'FAIL' : 'SKIP';
  console.log(`[test-indexing] ${icon.padEnd(4)} ${name} — ${detail}`);
}

async function main() {
  console.log('[test-indexing] 开始通路测试\n');

  const key = await checkKeyFileOnSite();
  printRow('IndexNow 密钥文件（线上）', key);

  const api = await checkIndexNowApi();
  printRow('IndexNow API', api);

  const gsc = await checkGscPath();
  printRow('GSC sitemap API', gsc);

  const failed =
    key.ok === false || api.ok === false || gsc.ok === false;
  console.log(failed ? '\n[test-indexing] 存在失败项' : '\n[test-indexing] 全部通过或可跳过项正常');
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});