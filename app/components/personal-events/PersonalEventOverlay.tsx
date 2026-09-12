'use client';
// app/components/personal-events/PersonalEventOverlay.tsx
// -----------------------------------------------------------------------------
// 个人事件弹窗：QQNT / 哔哩哔哩升级弹窗风 + 站点玻璃拟态语言。
//
// 触发：今天 API 返回 events 非空 + localStorage 无"已收下"标记
// 关闭：按钮 / Esc / 点击遮罩；关闭时写 localStorage 当日去重
// 隐私：客户端绝不感知日期（服务端不返回日期；client 不知道今天是几号）
// -----------------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';

import type { PersonalEventPublic } from '@/lib/personal-events/types';

const STORAGE_PREFIX = 'personal-event-';

export default function PersonalEventOverlay() {
  const [event, setEvent] = useState<PersonalEventPublic | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // 取今日事件；localStorage 已"收下"则跳过
  useEffect(() => {
    let cancelled = false;
    fetch('/api/personal-events/today')
      .then((r) => r.json() as Promise<{ events: PersonalEventPublic[] }>)
      .then(({ events }) => {
        if (cancelled || typeof window === 'undefined') return;
        const first = events[0];
        if (!first) return;
        if (window.localStorage.getItem(STORAGE_PREFIX + first.id)) return;
        setEvent(first);
      })
      .catch(() => {
        /* 静默：API 不可用 / 跨域失败时不打扰用户 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    if (event && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_PREFIX + event.id, '1');
    }
    setDismissed(true);
  }, [event]);

  // Esc 关闭
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [event, handleDismiss]);

  if (!event || dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      {/* 中心玻璃拟态卡片（v1.6.0：去硬编码 bg-white/10，改主题感知 var） */}
      <div
        className="relative w-full max-w-md rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="关闭"
          className="absolute right-4 top-4 text-white/70 transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-4 text-6xl drop-shadow" aria-hidden="true">
          {event.emoji}
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-white">{event.title}</h2>
        <p className="mb-6 text-base leading-relaxed text-white/85">
          {event.message}
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full bg-white px-6 py-2.5 font-medium text-slate-900 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
        >
          {event.ctaLabel}
        </button>
      </div>
    </div>
  );
}
