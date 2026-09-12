"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { getCountdown } from "@/lib/site";
import { GREETINGS, GREETING_DWELL, headerNav } from "@/lib/site";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import LiquidGlass from "./LiquidGlass";
import { SearchModal } from "./SearchModal";

// 获取当前时间格式化字符串（完整 YYYY/MM/DD HH:MM:SS，v1.7.3 回退：不再区分移动端紧凑版）
function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

function splitGraphemes(str: string) {
  return Array.from(str.normalize("NFC"));
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// 浮岛底色 + 文字色 class 切换器：Hero 上深底白字，滚过后主题底主题字。
// v1.7.4：Header 始终使用白半透玻璃态（--header-bg + --header-text），
// 不再随滚动在 Hero 上切换为深底白字透明态，两种主题观感一致。
function islandSurface() {
  return "bg-[var(--header-bg)] text-[var(--header-text)]";
}

export default function Header() {
  const pathname = usePathname();

  const [timeText, setTimeText] = useState("");
  const [countdownText, setCountdownText] = useState("");
  const [titleText, setTitleText] = useState("");
  const [isTitleTyping, setIsTitleTyping] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // 登录态：默认 false（与 SSR 一致，避免 hydration 抖动）；挂载后探测 /api/auth/me
  const [authed, setAuthed] = useState(false);

  // 滚动方向：'top' 展开 / 'down' 收缩 / 'up' 还原（useSyncExternalStore 订阅）
  const direction = useScrollDirection();
  const isCollapsed = direction === 'down';

  const clockIntervalRef = useRef<number | null>(null);
  const greetingIndexRef = useRef(0);
  const firstLoadRef = useRef(true);

  // 品牌问候：常驻 + 自动轮播（逐句打字切换）
  useEffect(() => {
    const startIdx = firstLoadRef.current
      ? 0
      : (greetingIndexRef.current + 1) % GREETINGS.length;
    greetingIndexRef.current = startIdx;
    firstLoadRef.current = false;

    if (prefersReducedMotion()) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- 一次性同步用户系统偏好到 React */
      setTitleText(GREETINGS[startIdx]);
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- 同上 */
      setIsTitleTyping(false);
      return;
    }

    let cancelled = false;
    let typingId: number | undefined;
    let rotateId: number | undefined;
    let idx = startIdx;

    const cycle = (greeting: string) => {
      if (cancelled) return;
      const chars = splitGraphemes(greeting);
      let i = 0;
      setTitleText("");
      setIsTitleTyping(true);

      typingId = window.setInterval(() => {
        if (cancelled) {
          window.clearInterval(typingId);
          return;
        }
        i += 1;
        setTitleText(chars.slice(0, i).join(""));

        if (i >= chars.length) {
          window.clearInterval(typingId);
          setIsTitleTyping(false);
          rotateId = window.setTimeout(() => {
            if (cancelled) return;
            idx = (idx + 1) % GREETINGS.length;
            greetingIndexRef.current = idx;
            cycle(GREETINGS[idx]);
          }, GREETING_DWELL);
        }
      }, 90);
    };

    cycle(GREETINGS[startIdx]);

    return () => {
      cancelled = true;
      if (typingId) window.clearInterval(typingId);
      if (rotateId) window.clearTimeout(rotateId);
    };
  }, [pathname]);

  // 客户端挂载后启动时钟
  useEffect(() => {
    const update = () => {
      setTimeText(getCurrentTime());
      setCountdownText(getCountdown());
    };
    update();
    clockIntervalRef.current = window.setInterval(update, 1000);

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    };
  }, []);

  // 登录态探测：复用 /api/auth/me（server-only 会话，绝不把 cookies() 拉进 layout）。
  // 默认 authed=false 与 SSR 一致，挂载后异步修正，避免 hydration 抖动。
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.authed) setAuthed(true);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 全局搜索快捷键
  const handleToggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
  }, []);

  // Dock CSS 光晕鼠标跟随（WebGL 不可用时的降级路径）。
  // LiquidGlass 组件已内置 WebGL 光晕（window.pointermove 自驱动），此处仅补 CSS
  // 兜底：把鼠标位置写入 --glow-x/y，驱动 .dock-glow 的 radial-gradient。
  // 直接写 style 不走 state，零重渲染；currentTarget 即各自岛容器。
  const handleDockGlow = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
    },
    [],
  );

  const handleDockGlowReset = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.currentTarget.style.setProperty("--glow-x", "50%");
      e.currentTarget.style.setProperty("--glow-y", "50%");
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleToggleSearch();
      }
      if (e.key === "Escape" && isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleSearch, isSearchOpen]);

  // 阅读进度条（仅文章详情页）
  useEffect(() => {
    const isArticle = pathname?.startsWith("/articles/") ?? false;
    if (!isArticle) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- 路径切换清理 */
      setReadingProgress(0);
      return;
    }
    let raf = 0;
    const compute = () => {
      raf = 0;
      const article = document.querySelector("article");
      if (!article) {
        /* eslint-disable-next-line react-hooks/set-state-in-effect -- DOM 未挂载 */
        setReadingProgress(0);
        return;
      }
      const rect = article.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      if (total <= 0) {
        /* eslint-disable-next-line react-hooks/set-state-in-effect -- 派生计算 */
        setReadingProgress(rect.top <= 0 ? 1 : 0);
      } else {
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        /* eslint-disable-next-line react-hooks/set-state-in-effect -- 派生计算 */
        setReadingProgress(Math.round((scrolled / total) * 1000) / 1000);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  const isArticle = pathname?.startsWith("/articles/") ?? false;

  return (
    // v1.7.1 浮岛胶囊 Header：
    //   桌面端单岛 / 移动端双岛，均挂 LiquidGlass 折射层
    //   滑动交互：滚动向下时岛1 液态收缩、岛2 上移到顶部；向上滚动还原展开
    //   按压反馈：active 时 scale 0.985（CSS 实现）
    //   文章页：岛1 收缩为 compact 形态（简化标题；进度条已迁至页面最顶部固定显示）
    <header className="fixed top-3 left-0 right-0 z-50 px-4 sm:px-6">
      {/* ========== 阅读进度条（仅文章详情页）：固定页面最顶部 ==========
          贴最顶边的细进度线，随阅读推进；眼标不放此处（阅读眼归属文章页阅读量指示）。 */}
      {isArticle && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] h-1 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute inset-y-0 left-0 bg-[var(--header-accent)] transition-[width] duration-150 ease-out"
            style={{ width: `${readingProgress * 100}%` }}
          />
        </div>
      )}
      {/* ========== 桌面端：单岛（md+） ========== */}
      <div
        className={`hidden md:flex relative liquid-dock glass-header px-5 py-3.5 items-center justify-between gap-4 transition-colors duration-300 ${islandSurface()}`}
        onPointerMove={handleDockGlow}
        onPointerLeave={handleDockGlowReset}
      >
        <LiquidGlass radius={30} />

        {/* Dock CSS 修饰层（兼容旧浏览器 / 无 WebGL） */}
        <div aria-hidden className="dock-refract" />
        <div aria-hidden className="dock-sheen" />
        <div aria-hidden className="dock-glow" />

        {/* 左：时间 + 节日倒计时 */}
        <div
          suppressHydrationWarning
          className="relative z-[2] text-left text-xs sm:text-sm leading-tight shrink-0"
        >
          <div className="font-mono">{timeText}</div>
          <div className="text-[var(--header-accent)]">{countdownText}</div>
        </div>

        {/* 中：品牌问候 */}
        <div className="relative z-[2] min-w-0 flex-1 text-center overflow-visible pointer-events-none">
          <div className="text-base sm:text-lg md:text-2xl font-bold text-[var(--header-accent)] tracking-wide whitespace-nowrap">
            {titleText}
            {isTitleTyping && (
              <span className="animate-pulse text-[var(--header-accent)] opacity-70">|</span>
            )}
          </div>
        </div>

        {/* 右：导航 */}
        <nav className="relative z-[2] flex justify-end shrink-0 items-center gap-2">
          <div className="hidden lg:flex items-center gap-6">
            {headerNav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[var(--header-accent)]">
                {item.label}
              </Link>
            ))}
          </div>
          {authed ? (
            <Link
              href="/account"
              aria-label="我的账号"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-all hover:bg-current/10 active:scale-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 默认头像 SVG 图标，无需 next/image 优化 */}
              <img src="/user.svg" alt="用户头像" className="h-5 w-5 rounded-full" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-all hover:bg-current/10"
            >
              登录
            </Link>
          )}
          <button
            onClick={handleToggleSearch}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-all hover:bg-current/10"
            aria-label="搜索文章"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">搜索</span>
          </button>
        </nav>
      </div>

      {/* ========== 移动端：双岛（<md） ==========
          岛1 信息岛：时间 + 倒计时 + 品牌问候
          岛2 操作岛：导航链接（横向滚动）+ 搜索 + 登录
          两条岛均挂 LiquidGlass 折射层 + CSS 兼容层
          滚动向下：岛1 液态收缩（高度/透明度/位移），岛2 上移
          文章页：岛1 收缩为 compact 形态 */}
      <div className="md:hidden w-full flex flex-col gap-2">
        {/* 岛1：信息岛（滚动向下时液态收缩） */}
        <div
          className={`relative w-full liquid-dock glass-header overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isCollapsed
              ? "h-0 opacity-0 -translate-y-2 px-4 py-0"
              : isArticle
                ? "h-8 opacity-100 translate-y-0 px-4 py-1"
                : "h-11 opacity-100 translate-y-0 px-3.5 py-2"
          } ${islandSurface()}`}
          style={{ willChange: "height, opacity, transform" }}
          onPointerMove={handleDockGlow}
          onPointerLeave={handleDockGlowReset}
        >
          <LiquidGlass radius={isArticle ? 16 : 22} />
          <div aria-hidden className="dock-refract" />
          <div aria-hidden className="dock-sheen" />
          <div aria-hidden className="dock-glow" />

          {/* 文章页 compact 形态：仅简化标题（进度条已迁至页面最顶部固定显示） */}
          {isArticle ? (
            <div className="relative z-[2] h-full flex items-center justify-between gap-2">
              <div className="text-xs font-medium text-[var(--header-accent)] shrink-0 whitespace-nowrap truncate">
                {titleText}
              </div>
            </div>
          ) : (
            <>
              {/* 左：时间（紧凑 HH:MM） */}
              <div
                suppressHydrationWarning
                className="relative z-[2] text-left leading-tight shrink-0"
              >
                <div className="font-mono text-sm font-semibold">{timeText}</div>
              </div>

              {/* 中：节日倒计时 */}
              <div
                suppressHydrationWarning
                className="relative z-[2] flex-1 min-w-0 text-left truncate"
              >
                <div className="text-xs text-[var(--header-accent)] truncate">
                  {countdownText}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 岛2：操作岛 */}
        <div
          className={`relative w-full liquid-dock glass-header pl-3 pr-1.5 py-1.5 flex items-center gap-1.5 min-w-0 transition-colors duration-300 ${islandSurface()}`}
          onPointerMove={handleDockGlow}
          onPointerLeave={handleDockGlowReset}
        >
          <LiquidGlass radius={22} />
          <div aria-hidden className="dock-refract" />
          <div aria-hidden className="dock-sheen" />
          <div aria-hidden className="dock-glow" />

          {/* 左：导航横向滚动（移动端只显示前 4 个核心项，剩余滚动可见） */}
          <nav className="relative z-[2] min-w-0 flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar nav-fade-mask">
            {headerNav.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 text-xs font-medium hover:text-[var(--header-accent)] transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

  
          <div className="relative z-[2] flex shrink-0 items-center gap-0.5 pl-1.5 border-l border-current/15">
            {authed ? (
              <Link
                href="/account"
                aria-label="我的账号"
                className="p-1.5 rounded-lg transition-all hover:bg-current/10 active:scale-95"
              >
                <img src="/user.svg" alt="用户头像" className="h-4 w-4 rounded-full" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-1.5 py-0.5 rounded-lg text-xs font-medium transition-all hover:bg-current/10 active:scale-95"
              >
                登录
              </Link>
            )}
             <button
              onClick={handleToggleSearch}
              className="p-1.5 rounded-lg transition-all hover:bg-current/10 active:scale-95"
              aria-label="搜索文章"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 全局搜索弹窗 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}