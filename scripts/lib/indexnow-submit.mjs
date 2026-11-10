const DEFAULT_HOST = 'yan.aivelo.net';
const DEFAULT_KEY = '702ac6e18573440ab2262eaca1147090';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10_000;

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

async function postIndexNow({ host, key, keyLocation: keyLoc, urlList }) {
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: keyLoc, urlList }),
  });
  return { status: res.status, text: await res.text() };
}

/** @returns {boolean} success */
export async function submitIndexNowUrls(urlList) {
  const list = [...new Set(urlList.map((u) => u.trim()).filter(Boolean))];
  if (list.length === 0) return true;

  const host = siteHostFromEnv();
  const key = indexNowKey();
  const keyLoc = keyLocation(host, key);

  let offset = 0;
  while (offset < list.length) {
    const chunk = list.slice(offset, offset + MAX_URLS_PER_REQUEST);
    offset += chunk.length;
    const { status, text } = await postIndexNow({ host, key, keyLocation: keyLoc, urlList: chunk });
    if (status !== 200 && status !== 202) {
      console.error(`[indexnow] 失败 HTTP ${status}:`, text || '(空响应)');
      return false;
    }
    console.log(`[indexnow] 已提交 ${chunk.length} 个变更 URL（HTTP ${status}）`);
  }
  return true;
}
