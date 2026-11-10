import type { APIRoute, GetStaticPaths } from 'astro';
import { getAllPosts, getPostBySlug, getPostSlug, postToMarkdown } from '@/lib/posts';

export const getStaticPaths = (async () => {
  const posts = await getAllPosts();
  return posts.map((post) => ({ params: { slug: getPostSlug(post) } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const post = await getPostBySlug(slug);
  if (!post) {
    return new Response('Not found', { status: 404 });
  }

  const markdown = postToMarkdown(post, post.body);

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
