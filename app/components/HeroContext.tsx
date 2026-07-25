"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { FeaturedItem } from "./GlobalHero";

// Phase 2（暂缓）接口：允许具体页面（如单篇文章）通过 useHero().setHero(...)
// 覆盖当前路由的 Hero 文案 / 背景图 / 精选推荐，实现「文章自定义 Banner」。
//
// Phase 1 仅预留干净接口；GlobalHero 当前仍以 route-aware 配置为准（resolveHero），
// 暂不消费此 context。后续在 RootLayout 挂载 <HeroProvider> 并让 GlobalHero 读取
// override 即可启用（见下方 TODO）。
export interface HeroOverride {
  eyebrow?: string;
  title?: string;
  desc?: string;
  href?: string;
  image?: string;
  featured?: FeaturedItem[];
}

interface HeroContextValue {
  override: HeroOverride | null;
  setHero: (override: HeroOverride | null) => void;
  resetHero: () => void;
}

const HeroContext = createContext<HeroContextValue | null>(null);

export function HeroProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<HeroOverride | null>(null);
  const resetHero = useCallback(() => setOverride(null), []);
  return (
    <HeroContext.Provider value={{ override, setHero: setOverride, resetHero }}>
      {children}
    </HeroContext.Provider>
  );
}

export function useHero(): HeroContextValue {
  const ctx = useContext(HeroContext);
  if (!ctx) {
    throw new Error("useHero 必须在 <HeroProvider> 内使用（Phase 2 将在 RootLayout 挂载）");
  }
  return ctx;
}
