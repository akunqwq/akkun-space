'use client';

import { useSyncExternalStore } from 'react';
import decor from '@/data/site/decor.json';

const EMOJIS: string[] = decor.floatingEmojis;

interface EmojiItem {
  id: number;
  emoji: string;
  left: number;
  animationDuration: number;
  animationDelay: number;
  fontSize: number;
}

// SSR 阶段返回的稳定空数组（getServerSnapshot）
const SERVER_SNAPSHOT: EmojiItem[] = [];

// 客户端首次调用时生成 + 缓存，后续调用返回同一引用（满足 useSyncExternalStore 对
// getSnapshot 必须返回稳定引用的要求，否则每次 render 都触发 re-subscribe）
let clientCache: EmojiItem[] | null = null;

function getClientSnapshot(): EmojiItem[] {
  if (clientCache) return clientCache;
  clientCache = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    left: Math.random() * 100,
    animationDuration: 8 + Math.random() * 10,
    animationDelay: Math.random() * 10,
    fontSize: 16 + Math.random() * 16,
  }));
  return clientCache;
}

// subscribe 空实现：emoji 数据在客户端生命周期内不变，无需订阅外部变化
// useSyncExternalStore 在此被借用 getServerSnapshot 的 SSR 兜底能力——
// 让 SSR HTML 无 emoji、首次 hydration 后客户端生成并填充。
const subscribe = () => () => {};

export default function FloatingEmojis() {
  const emojis = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => SERVER_SNAPSHOT
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[9999]">
      {emojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute animate-fall"
          style={{
            left: `${emoji.left}%`,
            top: '-50px',
            animationDuration: `${emoji.animationDuration}s`,
            animationDelay: `${emoji.animationDelay}s`,
            fontSize: `${emoji.fontSize}px`,
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
}
