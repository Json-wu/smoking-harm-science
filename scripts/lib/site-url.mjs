const DEFAULT_ORIGIN = 'https://yan.aivelo.net';

export function siteOrigin() {
  const raw = process.env.SITE_URL?.trim() || DEFAULT_ORIGIN;
  return raw.replace(/\/$/, '');
}

/** `src/content/blog/foo.md` → `https://…/blog/foo/` */
export function blogFileToPublicUrl(filePath, origin = siteOrigin()) {
  const match = filePath.match(/^src\/content\/blog\/(.+)\.mdx?$/);
  if (!match) return null;
  return `${origin}/blog/${match[1]}/`;
}
