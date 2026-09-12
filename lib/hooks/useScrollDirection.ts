/**
 * useScrollDirection — 滚动方向订阅 Hook
 *
 * 基于 useSyncExternalStore 订阅 window scroll，返回当前滚动方向：
 *   - 'top'  ：scrollY < 50（页面顶部）
 *   - 'down' ：正在向下滚动
 *   - 'up'   ：正在向上滚动
 *
 * 为什么用 useSyncExternalStore 而非 useEffect+setState：
 * - scroll 是 React 外部状态源，变化时需通知 React —— 正是该 Hook 的主场
 * - 避免 effect 里同步 setState 触发的级联渲染（react-hooks/set-state-in-effect）
 * - getServerSnapshot 固定 'top'，SSR/首帧 hydration 统一为"顶部"，无 mismatch
 *
 * 性能：
 * - direction 是 primitive（string），Object.is 稳定 → 仅方向变化时 re-render
 * - subscribe 函数对所有调用方共享，多订阅者不重复注册 listener
 *
 * 数据流：
 *   window scroll → 更新全局 state → 通知订阅者 → React 比较 direction
 * 而非：
 *   window scroll → useEffect → setState → React 再渲染
 */

'use client';

import { useSyncExternalStore } from 'react';

export type ScrollDirection = 'top' | 'up' | 'down';

// 全局单例 state（多订阅者共享，避免重复注册 listener）
let lastY = 0;
let direction: ScrollDirection = 'top';

// 顶部判定阈值：scrollY < 此值视为顶部，恢复展开态
const TOP_THRESHOLD = 50;

const subscribe = (callback: () => void) => {
  lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (y < TOP_THRESHOLD) {
      direction = 'top';
    } else if (y > lastY) {
      direction = 'down';
    } else if (y < lastY) {
      direction = 'up';
    }
    // y === lastY 时保持原方向
    lastY = y;
    callback();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
};

const getSnapshot = (): ScrollDirection => direction;
const getServerSnapshot = (): ScrollDirection => 'top';

/**
 * @returns 当前滚动方向
 * @example
 *   const direction = useScrollDirection();
 *   const collapsed = direction === 'down';
 */
export function useScrollDirection(): ScrollDirection {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}