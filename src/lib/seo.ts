import { siteName, siteUrl, siteDescription } from '@/lib/site';

const publisher = {
  '@type': 'Organization' as const,
  name: siteName,
  url: siteUrl,
};

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalized, siteUrl).href;
}

export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    inLanguage: 'zh-CN',
    publisher,
  };
}

export function buildWebPageJsonLd(options: {
  path: string;
  name: string;
  description: string;
}): Record<string, unknown> {
  const url = absoluteUrl(options.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: options.name,
    description: options.description,
    url,
    inLanguage: 'zh-CN',
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildArticleJsonLd(options: {
  path: string;
  headline: string;
  description: string;
  datePublished: string;
  articleSection: string;
  keywords?: string[];
}): Record<string, unknown> {
  const url = absoluteUrl(options.path);
  const keywords = options.keywords?.filter(Boolean) ?? [];
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.headline,
    description: options.description,
    datePublished: options.datePublished,
    dateModified: options.datePublished,
    author: publisher,
    publisher,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    inLanguage: 'zh-CN',
    articleSection: options.articleSection,
    ...(keywords.length ? { keywords: keywords.join(', ') } : {}),
  };
}

export function buildCategoryCollectionJsonLd(options: {
  slug: string;
  name: string;
  description: string;
  articlePaths: string[];
}): Record<string, unknown> {
  const url = absoluteUrl(`/category/${options.slug}/`);
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description,
    url,
    inLanguage: 'zh-CN',
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: options.articlePaths.length,
      itemListElement: options.articlePaths.map((path, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(path),
      })),
    },
  };
}

export function mergeJsonLd(
  ...blocks: (Record<string, unknown> | undefined)[]
): Record<string, unknown>[] {
  return blocks.filter((b): b is Record<string, unknown> => Boolean(b));
}
