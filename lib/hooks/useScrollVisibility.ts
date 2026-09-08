/**
 * useScrollVisibility — 滚动可见性订阅 Hook
 *
 * 基于 useSyncExternalStore 订阅 window scroll，返回"当前 scrollY 是否超过阈值"。
 *
 * 为什么用 useSyncExternalStore 而非 useEffect+setState：
 * - scroll 是 React 外部状态源，变化时需通知 React —— 正是该 Hook 的主场
 * - 避免.effect 里同步 setState 触发的级联渲染（react-hooks/set-state-in-effect）
 * - getServerSnapshot 返回 false，SSR/首帧 hydration 统一为"不可见"，无 mismatch
 *
 * 数据流：
 *   window scroll → external store → React（由 useSyncExternalStore 驱动）
 * 而非：
 *   window resize → useEffect → setState → React 再渲染
 */

'use client';

import { useSyncExternalStore } from 'react';

// 订阅函数对所有调用方共享：只负责注册/注销回调，不依赖 threshold
const subscribe = (callback: () => void) => {
  window.addEventListener('scroll', callback, { passive: true });
  return () => window.removeEventListener('scroll', callback);
};

/**
 * @param threshold - 滚动超过此 px 值时返回 true
 * @returns 当前是否可见（scrollY > threshold）
 */
export function useScrollVisibility(threshold: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.scrollY > threshold, // client snapshot
    () => false, // server snapshot（SSR / 首帧 hydration 兜底）
  );
}
