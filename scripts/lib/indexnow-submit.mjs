const DEFAULT_HOST = 'yan.aivelo.net';
const DEFAULT_KEY = '702ac6e18573440ab2262eaca1147090';

/** 会向所有参与方广播；另单独 POST 到 Bing 便于在 BWT IndexNow Insights 归因 */
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];

const MAX_URLS_PER_REQUEST = 10_000;
const PER_URL_DELAY_MS = 120;

export function siteHostFromEnv() {
  const fromEnv = process.env.SITE_URL || process.env.INDEXNOW_HOST;
  if (fromEnv) {
    try {
      return new URL(fromEnv.startsWith('http') ? fromEnv : `https://${fromEnv}`).host;
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_HOST;
}

export function indexNowKey() {
  return process.env.INDEXNOW_KEY?.trim() || DEFAULT_KEY;
}

function keyLocation(host, key) {
  return `https://${host}/${key}.txt`;
}

async function postIndexNow(endpoint, { host, key, keyLocation: keyLoc, urlList }) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: keyLoc, urlList }),
  });
  return { endpoint, status: res.status, text: await res.text() };
}

async function getIndexNow(endpoint, { url, key, keyLoc }) {
  const base = endpoint.replace(/\/indexnow\/?$/i, '');
  const params = new URLSearchParams({ url, key });
  if (keyLoc) params.set('keyLocation', keyLoc);
  const res = await fetch(`${base}/indexnow?${params.toString()}`);
  return { endpoint: base, url, status: res.status, text: await res.text() };
}

function okStatus(status) {
  return status === 200 || status === 202;
}

/**
 * @param {string[]} urlList
 * @param {{ mode?: 'bulk' | 'per-url' | 'both', perUrlDelayMs?: number }} [opts]
 * @returns {Promise<{ ok: boolean, report: object }>}
 */
export async function submitIndexNowUrls(urlList, opts = {}) {
  const list = [...new Set(urlList.map((u) => u.trim()).filter(Boolean))];
  if (list.length === 0) return { ok: true, report: { urlCount: 0 } };

  const mode = opts.mode || process.env.INDEXNOW_MODE || 'both';
  const delay = opts.perUrlDelayMs ?? Number(process.env.INDEXNOW_PER_URL_DELAY_MS || PER_URL_DELAY_MS);

  const host = siteHostFromEnv();
  const key = indexNowKey();
  const keyLoc = keyLocation(host, key);

  const report = {
    host,
    keyLocation: keyLoc,
    urlCount: list.length,
    mode,
    bulk: [],
    perUrl: [],
  };

  let allOk = true;

  if (mode === 'bulk' || mode === 'both') {
    let offset = 0;
    while (offset < list.length) {
      const chunk = list.slice(offset, offset + MAX_URLS_PER_REQUEST);
      offset += chunk.length;
      for (const endpoint of INDEXNOW_ENDPOINTS) {
        const result = await postIndexNow(endpoint, { host, key, keyLocation: keyLoc, urlList: chunk });
        report.bulk.push({ ...result, count: chunk.length });
        if (!okStatus(result.status)) {
          console.error(`[indexnow] bulk 失败 ${endpoint} HTTP ${result.status}:`, result.text || '(空)');
          allOk = false;
        } else {
          console.log(`[indexnow] bulk ${endpoint} → ${chunk.length} URL（HTTP ${result.status}）`);
        }
      }
    }
  }

  if (mode === 'per-url' || mode === 'both') {
    console.log(`[indexnow] 逐条提交 ${list.length} 个 URL（间隔 ${delay}ms）…`);
    for (const url of list) {
      for (const endpoint of INDEXNOW_ENDPOINTS) {
        const result = await getIndexNow(endpoint, { url, key, keyLoc });
        report.perUrl.push(result);
        if (!okStatus(result.status)) {
          console.error(`[indexnow] GET 失败 ${url} @ ${result.endpoint} HTTP ${result.status}`);
          allOk = false;
        }
      }
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    }
    const okCount = report.perUrl.filter((r) => okStatus(r.status)).length;
    console.log(`[indexnow] 逐条完成：${okCount}/${report.perUrl.length} 次请求为 200/202`);
  }

  return { ok: allOk, report };
}