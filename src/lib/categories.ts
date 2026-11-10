import type { CollectionEntry } from 'astro:content';

export type BlogCategory = '吸烟危害' | '戒烟方法' | '烟草知识';

export type CategorySlug = 'harm' | 'methods' | 'knowledge';

export const categoryCatalog: Record<
  CategorySlug,
  { label: BlogCategory; title: string; description: string }
> = {
  harm: {
    label: '吸烟危害',
    title: '吸烟危害',
    description: '疾病风险、二手烟与特定人群健康影响，帮助理解吸烟带来的可改变风险。',
  },
  methods: {
    label: '戒烟方法',
    title: '戒烟方法',
    description: '戒断反应、药物与行为支持、场景应对与复吸处理等务实策略。',
  },
  knowledge: {
    label: '烟草知识',
    title: '烟草知识',
    description: '烟草成分、产品类型、政策与流行率数据，减少信息不对称与误区。',
  },
};

export function getCategoryBySlug(slug: string): (typeof categoryCatalog)[CategorySlug] | undefined {
  if (slug in categoryCatalog) return categoryCatalog[slug as CategorySlug];
  return undefined;
}

export function getCategorySlugByLabel(label: BlogCategory): CategorySlug | undefined {
  const entry = Object.entries(categoryCatalog).find(([, v]) => v.label === label);
  return entry ? (entry[0] as CategorySlug) : undefined;
}

export function filterPostsByCategory<T extends CollectionEntry<'blog'>>(
  posts: T[],
  label: BlogCategory,
): T[] {
  return posts.filter((post) => post.data.category === label);
}
