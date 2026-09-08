import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { getBiliClient } from '@/lib/bili/client';
import type { BiliVideoItem, VideoStatus } from '@/lib/bili/types';
import VideoList from '@/app/components/tools/VideoList';
import VideoStatQuery from '@/app/components/tools/VideoStatQuery';

export const revalidate = 3600;

interface Props {
  params: Promise<{ mid: string }>;
}

function faceUrl(face: string): string {
  if (!face) return '';
  return face.startsWith('//') ? `https:${face}` : face;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mid } = await params;
  return {
    title: `UP 主 ${mid} 数据`,
    description: `B 站 UP 主（mid ${mid}）的粉丝、视频与互动数据查询。`,
  };
}

export default async function UpDetailPage({ params }: Props) {
  const { mid: midStr } = await params;
  const mid = Number(midStr);
  if (!Number.isInteger(mid) || mid <= 0) notFound();

  const client = getBiliClient();
  // allSettled：基础资料（card 非签名接口）成功即可渲染；投稿列表（WBI 签名接口，
  // 服务器 IP 易被 B 站 -352 风控拦截）失败则降级为空列表 + 提示，绝不让单接口
  // 抛错触发全局 error.tsx。
  const [upRes, vidRes] = await Promise.allSettled([
    client.getUpInfo(mid),
    client.getUpVideos(mid, 1),
  ]);

  if (upRes.status === 'rejected') {
    // 连非签名的 card 接口都拿不到（B 站整体不可达），给出友好占位而非崩溃
    return (
      <section>
        <Link
          href="/tools/bili-up"
          className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--bili-blue)]"
        >
          ← 返回查询
        </Link>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            暂未获取到该 UP 主资料
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            B 站接口暂时无法访问（可能是网络或风控拦截）。请稍后重试，或确认 mid
            <span className="mx-1 font-mono">{mid}</span>
            是否正确。
          </p>
        </div>
      </section>
    );
  }

  const { info, stat, card, degraded } = upRes.value.data;
  let videos: BiliVideoItem[] = [];
  let videoTotal = 0;
  let videoStatus: VideoStatus = 'unavailable';
  if (vidRes.status === 'fulfilled') {
    videos = vidRes.value.videos;
    videoTotal = vidRes.value.videoTotal;
    videoStatus = vidRes.value.status;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: info.name,
    url: `https://space.bilibili.com/${info.mid}`,
    identifier: String(info.mid),
  };

  const totalPlay = videos.reduce((s, v) => s + v.play, 0);

  return (
    <section>
      {degraded && (
        <p className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          数据可能延迟（B 站接口降级，返回的是缓存数据）。
        </p>
      )}

      <Link
        href="/tools/bili-up"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--bili-blue)]"
      >
        ← 返回查询
      </Link>

      <div className="flex items-start gap-4">
        {info.face && (
          <img
            src={faceUrl(info.face)}
            alt={info.name}
            className="h-20 w-20 rounded-2xl border border-[var(--card-border)] object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-[var(--text-primary)] md:text-2xl">
              {info.name}
            </h2>
            {info.official_verify && (
              <span className="rounded-full bg-[var(--bili-pink-soft)] px-2 py-0.5 text-xs text-[var(--bili-pink)]">
                认证
              </span>
            )}
            <span className="rounded-full border border-[var(--card-border)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
              LV{info.level}
            </span>
            {info.vip_type > 0 && (
              <span className="rounded-full border border-[var(--bili-pink-soft)] px-2 py-0.5 text-xs text-[var(--bili-pink)]">
                大会员
              </span>
            )}
          </div>
          {info.sign && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
              {info.sign}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="粉丝" value={stat.follower.toLocaleString()} />
            <Stat label="关注" value={stat.following.toLocaleString()} />
            <Stat label="视频数" value={card.card.archive_count.toLocaleString()} />
            <Stat label="列表总播放" value={totalPlay.toLocaleString()} />
          </div>
        </div>
      </div>

      {info.live_room?.liveStatus === 1 && info.live_room.url && (
        <a
          href={info.live_room.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-400"
        >
          正在直播：{info.live_room.title || '前往直播间'}
        </a>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            投稿视频
          </h3>
          <span className="text-sm text-[var(--text-muted)]">
            共 {videoTotal.toLocaleString()} 个
          </span>
        </div>
        <VideoList videos={videos} status={videoStatus} />
      </div>

      <VideoStatQuery />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="mt-0.5 font-mono text-base font-semibold text-[var(--text-primary)]">
        {value}
      </div>
    </div>
  );
}
