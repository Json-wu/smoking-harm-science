import { GoogleAuth } from 'google-auth-library';
import { siteOrigin } from './site-url.mjs';

const WEBMASTERS_SCOPE = 'https://www.googleapis.com/auth/webmasters';

function loadServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    console.error('[gsc] GOOGLE_SERVICE_ACCOUNT_JSON 不是合法 JSON');
    return null;
  }
}

/**
 * 在 GSC 中重新提交 sitemap（促使 Google 拉取新版 URL 列表）。
 * 需在 GSC 将服务账号邮箱加为「完全」用户。
 * @see https://developers.google.com/webmaster-tools/v1/sitemaps/submit
 */
export async function submitGscSitemap() {
  const credentials = loadServiceAccount();
  if (!credentials) {
    console.log('[gsc] 未配置 GOOGLE_SERVICE_ACCOUNT_JSON，跳过 Search Console sitemap 提交');
    return 'skipped';
  }

  const origin = siteOrigin();
  const siteUrl = `${origin}/`;
  const sitemapUrl = `${origin}/sitemap.xml`;

  const auth = new GoogleAuth({ credentials, scopes: [WEBMASTERS_SCOPE] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token?.token) {
    console.error('[gsc] 无法获取 access token');
    return false;
  }

  const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token.token}` },
  });

  if (res.status === 204 || res.status === 200) {
    console.log('[gsc] 已重新提交 sitemap:', sitemapUrl);
    return true;
  }

  const text = await res.text();
  console.error(`[gsc] sitemap 提交失败 HTTP ${res.status}:`, text || '(空)');
  return false;
}
