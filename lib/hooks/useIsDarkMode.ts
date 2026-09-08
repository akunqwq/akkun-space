/**
 * useIsDarkMode — 主题模式订阅 Hook
 *
 * 基于 useSyncExternalStore 订阅 documentElement 的 class 变化，
 * 返回当前是否为深色模式。
 *
 * 为什么用 useSyncExternalStore 而非 useEffect+setState：
 * - 主题（document.documentElement.classList 的 'dark' 标记）是 React 外部状态源，
 *   由 ThemeProvider / 系统偏好 / 用户切换修改 —— 正是该 Hook 的主场
 * - getServerSnapshot 返回 false，SSR/首帧 hydration 统一为"浅色"，无 mismatch
 *   下游组件（如 ClientCodeBlock）因此不再需要自己的 mounted flag + checkTheme
 *
 * 数据流：
 *   documentElement.classList 变化 → MutationObserver → React（由 useSyncExternalStore 驱动）
 */

'use client';

import { useSyncExternalStore } from 'react';

// 订阅函数对所有调用方共享：监听 <html> 的 class 属性变化
const subscribe = (callback: () => void) => {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
};

/**
 * @returns 当前是否为深色模式（documentElement 含 'dark' class）
 */
export function useIsDarkMode(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains('dark'), // client snapshot
    () => false, // server snapshot（SSR / 首帧 hydration 兜底为浅色）
  );
}
