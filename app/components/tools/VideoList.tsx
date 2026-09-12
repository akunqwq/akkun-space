import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import type { BiliVideoItem, VideoStatus } from '@/lib/bili/types';

export default function VideoList({
  videos,
  status,
}: {
  videos: BiliVideoItem[];
  status: VideoStatus;
}) {
  if (videos.length === 0) {
    // 明确区分：被风控拦截（拿不到任何数据）vs 真的没视频
    if (status === 'unavailable') {
      return (
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          投稿列表暂时受到 B 站风控限制，视频无法展示，请稍后重试。
        </p>
      );
    }
    return <p className="text-sm text-[var(--text-muted)]">暂无视频数据</p>;
  }

  return (
    <div>
      {status === 'stale' && (
        <p className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          投稿列表为缓存数据，可能略有延迟。
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          // 容器用 div：卡片内同时有「B 站观看」外链与「查数据」站内链接，a 不能嵌套 a
          <div
            key={v.bvid}
            className="group overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] transition hover:border-[var(--accent)]/50"
          >
            <a
              href={`https://www.bilibili.com/video/${v.bvid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-video overflow-hidden bg-black/10"
            >
              <img
                src={v.pic.startsWith('//') ? `https:${v.pic}` : v.pic}
                alt={v.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </a>
            <div className="p-3">
              <h4 className="line-clamp-2 text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                {v.title}
              </h4>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                <span className="min-w-0 truncate">
                  播放 {v.play.toLocaleString()}
                  <span className="mx-1.5">·</span>
                  {new Date(v.created * 1000).toLocaleDateString('zh-CN')}
                </span>
                <Link
                  href={`/tools/bili-video?bvid=${v.bvid}`}
                  className="shrink-0 text-[var(--accent)] hover:underline"
                >
                  查数据
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
