import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(['吸烟危害', '戒烟方法', '烟草知识']),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
