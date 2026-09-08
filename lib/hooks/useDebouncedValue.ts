/**
 * useDebouncedValue — 输入防抖 Hook
 *
 * 返回一个延迟更新的 value，适用于搜索框等高频输入场景：
 * 用户停止输入 `delay` ms 后才更新值，避免每次按键触发搜索/重算。
 *
 * 归属说明：
 *   原与搜索工具同放 lib/content/search-utils.ts，但该模块同时被
 *   服务端组件（SSG 路径）与客户端组件导入——React hook 的 import
 *   链在服务端模块解析时报 EcmaScript file had an error。
 *   故拆到 lib/hooks/（React 专属 hook 目录，与 lib/utils 纯函数分离）。
 *
 * @example
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebouncedValue(query, 200);
 *   // debouncedQuery 会在 setQuery 停止 200ms 后更新
 */

'use client';

import { useEffect, useState } from 'react';

/** 防抖延迟（ms）—— 搜索场景的默认值 */
export const SEARCH_DEBOUNCE_MS = 200;

export function useDebouncedValue<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
