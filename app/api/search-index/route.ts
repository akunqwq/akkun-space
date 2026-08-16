import { NextResponse } from 'next/server';
import { getPostsIndex } from '@/lib/posts';

export const dynamic = 'force-static';

export async function GET() {
  const posts = getPostsIndex();

  // 精简数据：只暴露检索必需字段，控制传输体积
  const searchIndex = posts.map((post) => ({
    id: post.slug,
    title: post.title,
    description: post.summary || '',
    tags: post.tags || [],
    category: post.type ?? '',
  }));

  return NextResponse.json(searchIndex, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
