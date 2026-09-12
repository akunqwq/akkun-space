import type { Metadata } from 'next';

import VideoStatQuery from '@/app/components/tools/VideoStatQuery';

export const metadata: Metadata = {
  title: 'B 站视频数据查询',
  description:
    '输入 BV 号或直接粘贴视频链接，实时查询单条视频的播放、弹幕、点赞、投币、收藏等互动数据。免费、打开即用。',
};

interface Props {
  searchParams: Promise<{ bvid?: string }>;
}

export default async function BiliVideoPage({ searchParams }: Props) {
  // ?bvid= 带参进入（来自 UP 主详情页视频列表「查数据」联动）时预填并自动查询
  const { bvid } = await searchParams;
  const initialBvid =
    bvid && /^BV[a-zA-Z0-9]{8,}$/.test(bvid) ? bvid : '';

  return (
    <section>
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] md:text-2xl">
          B 站视频数据查询
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
          输入视频 BV 号或直接粘贴视频页链接，实时查询单条视频的播放、弹幕、点赞、投币等互动数据。
        </p>
      </div>
      <VideoStatQuery initialBvid={initialBvid} />
    </section>
  );
}
