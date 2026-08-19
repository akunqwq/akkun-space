"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { getCountdown } from "@/lib/holidays";
import { GREETINGS, GREETING_DWELL } from "@/lib/greetings";
import { headerNav } from "@/lib/nav";
import { SearchModal } from "./SearchModal";

// 获取当前时间格式化字符串（包含秒数）
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

export default function Header() {
  const pathname = usePathname();

  const [timeText, setTimeText] = useState("");
  const [countdownText, setCountdownText] = useState("");
  const [titleText, setTitleText] = useState("");
  const [isTitleTyping, setIsTitleTyping] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const clockIntervalRef = useRef<number | null>(null);
  const greetingIndexRef = useRef(0);
  const firstLoadRef = useRef(true);

  // 品牌问候：常驻 + 自动轮播（逐句打字切换，不隐藏），按数组顺序轮换（非随机）
  // 路由变化/导航切换 = 一次 brand reload：前进到下一句，再继续顺序轮播
  useEffect(() => {
    // 首次加载从第 0 句开始；之后每次导航切换前进一句（顺序、循环）
    const startIdx = firstLoadRef.current
      ? 0
      : (greetingIndexRef.current + 1) % GREETINGS.length;
    greetingIndexRef.current = startIdx;
    firstLoadRef.current = false;

    // 无障碍：减少动效时静态显示当前句，不轮播
    if (prefersReducedMotion()) {
      setTitleText(GREETINGS[startIdx]);
      setIsTitleTyping(false);
      return;
    }

    // 计时器 id 用 effect 内局部变量，而非共享 ref：
    // 避免 StrictMode 双挂载 / 路由切换时两个 cycle 链交叉清理、并发写同一 state（重字根因）
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
        // 从源数组按当前长度切片计算，绝不在 updater 里读会变动的闭包 i，
        // 杜绝「updater 延迟 flush 时 i 已自增」导致的丢字/错位
        setTitleText(chars.slice(0, i).join(""));

        if (i >= chars.length) {
          window.clearInterval(typingId);
          setIsTitleTyping(false);
          rotateId = window.setTimeout(() => {
            if (cancelled) return;
            idx = (idx + 1) % GREETINGS.length; // 顺序前进
            greetingIndexRef.current = idx;
            cycle(GREETINGS[idx]);
          }, GREETING_DWELL);
        }
      }, 90); // 正常打字速度
    };

    cycle(GREETINGS[startIdx]);

    return () => {
      cancelled = true;
      if (typingId) window.clearInterval(typingId);
      if (rotateId) window.clearTimeout(rotateId);
    };
  }, [pathname]);

  // 客户端挂载后启动时钟：时间逐秒走动，倒计时常驻显示
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

  // 全局搜索快捷键：Cmd+K / Ctrl+K 打开搜索，ESC 关闭
  const handleToggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K 或 Ctrl+K 打开/关闭搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleToggleSearch();
      }
      // ESC 关闭搜索
      if (e.key === 'Escape' && isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSearch, isSearchOpen]);

  // 沉浸式 Header：所有路由都有全屏 GlobalHero，故顶部一律透明浮于 Hero 上，
  // 滚过 Hero（约 85vh）后变实底；资讯存档等无 Hero 的边界场景仍保持可读。
  const transparent = !scrolled;
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.85);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // 阅读进度条（仅文章详情页 /articles/<slug>）：进度仅基于 <article> 内容，
  // 不含 Header / Footer / 评论区。0% → 滚到文章顶；100% → 文章底到达视口底。
  useEffect(() => {
    const isArticle = pathname?.startsWith("/articles/") ?? false;
    if (!isArticle) {
      setReadingProgress(0);
      return;
    }
    let raf = 0;
    const compute = () => {
      raf = 0;
      const article = document.querySelector("article");
      if (!article) {
        setReadingProgress(0);
        return;
      }
      const rect = article.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      if (total <= 0) {
        // 文章不足一屏：顶部到达视口顶即视为读完
        setReadingProgress(rect.top <= 0 ? 1 : 0);
      } else {
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
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

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      {/* 背景层：顶部透明（沉浸 Hero），滚过后实底；transition 平滑切换 */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          transparent
            ? "bg-gradient-to-b from-black/40 via-black/15 to-transparent"
            : "bg-[var(--header-bg)] shadow-lg border-b border-[var(--header-border)] backdrop-blur-xl"
        }`}
      />

      {/* 内容层：CSS Grid 三栏 [auto_1fr_auto]，无 absolute 子元素，不裁切不重叠 */}
      <div className="relative grid grid-cols-[auto_1fr_auto] items-center w-full px-4 sm:px-8 py-4 gap-2 sm:gap-6">

        {/* 左：时间 + 节日倒计时（常驻，类似系统托盘时钟） */}
        <div
          suppressHydrationWarning
          className={`text-left text-xs sm:text-sm leading-tight shrink-0 ${
            transparent ? "text-white/90" : "text-[var(--text-primary)]"
          }`}
        >
          {/* 日期：浮于 Hero 上时白色与图片融合（light/dark 一致），滚动后回主题色保证可读 */}
          <div className={`font-mono ${transparent ? "text-white" : "text-[var(--text-primary)]"}`}>{timeText}</div>
          <div className="text-[var(--accent)]">{countdownText}</div>
        </div>

        {/* 中：品牌问候 — Grid 1fr 列，overflow-visible 不裁切文本；pointer-events-none 不挡导航 */}
        <div className="min-w-0 text-center overflow-visible pointer-events-none">
          <div className="text-base sm:text-lg md:text-2xl font-bold text-[var(--accent)] tracking-wide whitespace-nowrap">
            {titleText}
            {isTitleTyping && (
              <span className="animate-pulse text-[var(--accent)] opacity-70">|</span>
            )}
          </div>
        </div>

        {/* 右：导航 */}
        <div className="flex justify-end shrink-0">
          {/* 桌面端导航 */}
          <nav
            className={`hidden md:flex items-center gap-6 ${
              transparent ? "text-white/90" : "text-[var(--text-primary)]"
            }`}
          >
            {headerNav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[var(--accent)]">
                {item.label}
              </Link>
            ))}
            {/* 搜索按钮 */}
            <button
              onClick={handleToggleSearch}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-all ${
                transparent
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5'
              }`}
              aria-label="搜索文章"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">搜索</span>
            </button>
          </nav>

          {/* 移动端汉堡菜单 */}
          <button
            className={`md:hidden focus:outline-none ${
              transparent ? "text-white" : "text-[var(--text-primary)]"
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="菜单"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 w-full bg-current transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block h-0.5 w-full bg-current transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 w-full bg-current transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden relative z-50 bg-[var(--header-bg)] backdrop-blur-xl border-t border-[var(--header-border)]">
          <nav className="flex flex-col py-4 px-8 space-y-3">
            {headerNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[var(--text-primary)] hover:text-[var(--accent)] py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {/* 移动端搜索入口 */}
            <button
              onClick={() => { setIsMobileMenuOpen(false); setIsSearchOpen(true); }}
              className="flex items-center gap-2 text-[var(--text-primary)] hover:text-[var(--accent)] py-2"
            >
              <Search className="h-4 w-4" />
              搜索文章
            </button>
          </nav>
        </div>
      )}

      {/* 阅读进度条：仅文章详情页显示，贴 Header 底边，2px 高，Pink Accent，平滑过渡 */}
      {pathname?.startsWith("/articles/") && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent transition-[width] duration-150 ease-out z-[1]"
          style={{ width: `${readingProgress * 100}%` }}
          aria-hidden="true"
        />
      )}

      {/* 全局搜索弹窗 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
