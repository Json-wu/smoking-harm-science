import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/** Content Collection 的 id 可能带 `.md` / `.mdx` 后缀，对外 URL 统一不含扩展名。 */
export function getPostSlug(post: BlogPost): string {
  return post.id.replace(/\.mdx?$/, '');
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog');
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => getPostSlug(post) === slug);
}

/** 列表按发布时间从新到旧排序；上一篇=更旧，下一篇=更新。 */
export function getAdjacentPosts(
  slug: string,
  posts: BlogPost[],
): { older?: BlogPost; newer?: BlogPost } {
  const index = posts.findIndex((post) => getPostSlug(post) === slug);
  if (index === -1) return {};
  return {
    older: index < posts.length - 1 ? posts[index + 1] : undefined,
    newer: index > 0 ? posts[index - 1] : undefined,
  };
}

const BLOG_CATEGORIES = ['吸烟危害', '戒烟方法', '烟草知识'] as const;

/** 继续阅读：各推荐一篇，来自除当前分类外的另外两个分类（每类取最新一篇）。 */
export function getRecommendedPosts(
  current: BlogPost,
  posts: BlogPost[],
  limit = 2,
): BlogPost[] {
  const currentSlug = getPostSlug(current);
  const others = posts.filter((post) => getPostSlug(post) !== currentSlug);
  const otherCategories = BLOG_CATEGORIES.filter((c) => c !== current.data.category);

  const picked: BlogPost[] = [];
  const usedSlugs = new Set<string>();

  for (const cat of otherCategories) {
    const post = others.find((p) => p.data.category === cat);
    if (post) {
      picked.push(post);
      usedSlugs.add(getPostSlug(post));
    }
  }

  if (picked.length < limit) {
    for (const post of others) {
      if (picked.length >= limit) break;
      const slug = getPostSlug(post);
      if (usedSlugs.has(slug) || post.data.category === current.data.category) continue;
      picked.push(post);
      usedSlugs.add(slug);
    }
  }

  return picked.slice(0, limit);
}

/** 从 frontmatter + 正文生成干净的 Markdown 副本（供 alternate 链接与 AI 收录）。 */
export function postToMarkdown(post: BlogPost, body: string): string {
  const { title, description, pubDate, category, tags } = post.data;
  const date = pubDate.toISOString().slice(0, 10);
  const tagLine = tags.length ? `tags: [${tags.map((t) => `"${t}"`).join(', ')}]\n` : '';

  return `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
pubDate: ${date}
category: "${category}"
${tagLine}---

# ${title}

${body.trim()}
`;
}
