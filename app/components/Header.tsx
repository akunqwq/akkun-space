"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCountdown } from "@/lib/holidays";
import { GREETINGS, GREETING_DWELL } from "@/lib/greetings";

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

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      {/* 背景层：backdrop-filter 隔离，不污染内容层 */}
      <div className="absolute inset-0 backdrop-blur-xl bg-[var(--header-bg)] shadow-lg border-b border-[var(--header-border)]" />

      {/* 内容层：CSS Grid 三栏 [auto_1fr_auto]，无 absolute 子元素，不裁切不重叠 */}
      <div className="relative grid grid-cols-[auto_1fr_auto] items-center w-full px-4 sm:px-8 py-4 gap-2 sm:gap-6">

        {/* 左：时间 + 节日倒计时（常驻，类似系统托盘时钟） */}
        <div
          suppressHydrationWarning
          className="text-left text-xs sm:text-sm leading-tight shrink-0"
        >
          <div className="font-mono text-pink-400 dark:text-violet-400">{timeText}</div>
          <div className="text-[var(--text-secondary)]">{countdownText}</div>
        </div>

        {/* 中：品牌问候 — Grid 1fr 列，overflow-visible 不裁切文本；pointer-events-none 不挡导航 */}
        <div className="min-w-0 text-center overflow-visible pointer-events-none">
          <div className="text-base sm:text-lg md:text-2xl font-bold text-pink-400 dark:text-violet-400 tracking-wide whitespace-nowrap">
            {titleText}
            {isTitleTyping && (
              <span className="animate-pulse text-[var(--text-primary)]">|</span>
            )}
          </div>
        </div>

        {/* 右：导航 */}
        <div className="flex justify-end shrink-0">
          {/* 桌面端导航 */}
          <nav className="hidden md:flex gap-6 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
            <Link href="/" className="hover:text-violet-500">首页</Link>
            <Link href="/articles" className="hover:text-violet-500">文章</Link>
            <Link href="/games" className="hover:text-violet-500">游戏</Link>
            <Link href="/changelog" className="hover:text-violet-500">更新日志</Link>
            <Link href="/about" className="hover:text-violet-500">关于本喵</Link>
          </nav>

          {/* 移动端汉堡菜单 */}
          <button
            className="md:hidden text-[var(--text-secondary)] dark:text-[var(--text-secondary)] focus:outline-none"
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
            <Link
              href="/"
              className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:text-violet-500 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              首页
            </Link>
            <Link
              href="/articles"
              className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:text-violet-500 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              文章
            </Link>
            <Link
              href="/games"
              className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:text-violet-500 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              游戏
            </Link>
            <Link
              href="/changelog"
              className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:text-violet-500 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              更新日志
            </Link>
            <Link
              href="/about"
              className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:text-violet-500 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              关于本喵
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
