// app/components/tools/VideoStatQuery.tsx
// -----------------------------------------------------------------------------
// 视频数据查询组件（Client Component）—— /tools/bili-video 独立 tool 页主体
// 输入 BV 号（或直接粘贴视频页 URL，自动提取）→ 调 /api/bili/video-stat
// → 展示视频信息卡（封面/标题/UP主/时长/发布时间）+ 播放/弹幕/收藏等统计
// 支持 initialBvid：?bvid= 带参进入时自动查询（UP 主详情页视频列表联动入口）
// 注：v1.3.0 前本组件内嵌于 UP 主详情页底部，独立成页后由 /tools/bili-video 承载
// -----------------------------------------------------------------------------
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import type { BiliVideoDetail } from '@/lib/bili/types';

interface ApiResponse {
  code: number;
  data?: BiliVideoDetail;
  degraded?: boolean;
  message?: string;
}

/** 从用户输入提取 BV 号：兼容纯 BV 号与完整视频页 URL（https://www.bilibili.com/video/BV1xx.../?p=1） */
function extractBvid(raw: string): string | null {
  const m = raw.match(/BV[a-zA-Z0-9]{8,}/);
  return m ? m[0] : null;
}

/** 数字缩写：亿 / 万（与站内其他统计展示口径一致） */
function formatNum(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return String(n);
}

/** 秒数 → h:mm:ss / mm:ss */
function formatDuration(sec: number): string {
  if (!sec) return '--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** 封面 URL：B 站可能返回协议相对地址（// 开头），统一补 https: */
function httpsUrl(url: string): string {
  if (!url) return '';
  return url.startsWith('//') ? `https:${url}` : url;
}

export default function VideoStatQuery({ initialBvid = '' }: { initialBvid?: string }) {
  const [bvid, setBvid] = useState(initialBvid);
  const [stat, setStat] = useState<BiliVideoDetail | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useCallback(async (target: string) => {
    if (!/^(BV[a-zA-Z0-9]{8,})$/.test(target)) {
      setError('BV 号格式无效（如 BV1xx411x7xx）');
      return;
    }
    setError(null);
    setLoading(true);
    setStat(null);
    setDegraded(false);

    try {
      const resp = await fetch(`/api/bili/video-stat?bvid=${encodeURIComponent(target)}`);
      const json: ApiResponse = await resp.json();
      if (json.code !== 0 || !json.data) {
        setError(json.message ?? '查询失败');
        return;
      }
      setStat(json.data);
      setDegraded(json.degraded ?? false);
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // ?bvid= 带参进入（来自 UP 主详情页视频列表联动）时自动查询一次
  useEffect(() => {
    const t = initialBvid.trim();
    if (t) void query(t);
  }, [initialBvid, query]);

  const handleQuery = useCallback(() => {
    const trimmed = bvid.trim();
    if (!trimmed) {
      setError('请输入 BV 号或视频链接');
      return;
    }
    // 粘贴完整链接场景：直接提取 BV 号再查，用户无需手动截取
    const extracted = extractBvid(trimmed) ?? trimmed;
    if (extracted !== trimmed) setBvid(extracted);
    void query(extracted);
  }, [bvid, query]);

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
      <div className="flex gap-3">
        <input
          type="text"
          value={bvid}
          onChange={(e) => {
            setBvid(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) handleQuery();
          }}
          placeholder="输入 BV 号或直接粘贴视频链接"
          className="flex-1 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] caret-[var(--bili-blue)] outline-none transition-all duration-200 focus:border-[var(--bili-blue)] focus:ring-2 focus:ring-[var(--bili-blue-ring)] focus:shadow-[0_0_14px_var(--bili-blue-glow)]"
          aria-label="BV 号输入框"
        />
        <button
          type="button"
          onClick={handleQuery}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-[var(--bili-blue)] px-5 py-2.5 font-medium text-white transition-all duration-200 hover:bg-[var(--bili-pink)] hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span>查</span>
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {degraded && (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber-500">
          <AlertTriangle className="h-3.5 w-3.5" />
          数据可能延迟（B 站接口降级，返回的是缓存数据）
        </p>
      )}

      {stat && (
        <div className="mt-5">
          {/* 视频信息卡：封面 + 标题 + UP 主 + 时长/发布时间 + 外链 */}
          <div className="overflow-hidden rounded-2xl border border-[var(--card-border)]">
            <div className="flex flex-col sm:flex-row">
              {stat.pic && (
                <a
                  href={`https://www.bilibili.com/video/${stat.bvid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block shrink-0 aspect-video sm:aspect-auto sm:w-60 overflow-hidden bg-black/10"
                >
                  <img
                    src={httpsUrl(stat.pic)}
                    alt={stat.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                </a>
              )}
              <div className="min-w-0 flex-1 p-4">
                <h4 className="line-clamp-2 font-semibold text-[var(--text-primary)]">
                  {stat.title || stat.bvid}
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                  {stat.owner_mid > 0 && (
                    <a
                      href={`https://space.bilibili.com/${stat.owner_mid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--bili-blue)] hover:underline"
                    >
                      UP：{stat.owner_name || stat.owner_mid}
                    </a>
                  )}
                  <span>时长 {formatDuration(stat.duration)}</span>
                  {stat.pubdate > 0 && (
                    <span>发布于 {new Date(stat.pubdate * 1000).toLocaleDateString('zh-CN')}</span>
                  )}
                </div>
                <a
                  href={`https://www.bilibili.com/video/${stat.bvid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--bili-blue)] hover:underline"
                >
                  在 B 站观看
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* 互动统计：8 格 */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: '播放', value: stat.view },
              { label: '弹幕', value: stat.danmaku },
              { label: '评论', value: stat.reply },
              { label: '收藏', value: stat.favorite },
              { label: '投币', value: stat.coin },
              { label: '分享', value: stat.share },
              { label: '点赞', value: stat.like },
              { label: '当前排名', value: stat.now_rank },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-center"
              >
                <div className="text-lg font-bold text-[var(--accent)]">
                  {formatNum(item.value)}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
