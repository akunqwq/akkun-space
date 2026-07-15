"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getCountdown } from "@/lib/holidays";

// 获取当前时间格式化字符串（包含秒数）
function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

export default function Header() {
  // 初始化时就显示当前时间
  // 初始为空，避免 SSR 与客户端首屏因 new Date() 秒数不同导致 hydration 不匹配
  const [timeText, setTimeText] = useState("");
  const [countdownText, setCountdownText] = useState("");
  const [titleText, setTitleText] = useState(""); // 标题打字机效果
  const [isTitleTyping, setIsTitleTyping] = useState(false); // 标题打字状态
  const [titleHidden, setTitleHidden] = useState(false); // 打字完成后隐藏标题
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 移动端菜单状态

  const clockIntervalRef = useRef<number | null>(null);
  const titleTypingRef = useRef<number | null>(null);
  const titleHideTimeoutRef = useRef<number | null>(null); // 打字完成后延迟隐藏的定时器

  const fullTitle = "欢迎来到 阿鲲 の 个人 Blog";

  function splitGraphemes(str: string) {
    return Array.from(str.normalize("NFC"));
  }



  // 标题打字机效果
  useEffect(() => {
    // 只在首次挂载时执行
    if (titleText !== "") return; // 如果已经有内容了，就不重复执行

    setIsTitleTyping(true);
    const chars = splitGraphemes(fullTitle);
    let i = 0;

    titleTypingRef.current = window.setInterval(() => {
      if (i >= chars.length) {
        if (titleTypingRef.current) clearInterval(titleTypingRef.current);
        setIsTitleTyping(false);
        // 打字完成后稍作停留，再隐藏标题
        titleHideTimeoutRef.current = window.setTimeout(() => setTitleHidden(true), 1000);
        return;
      }

      const currentChar = chars[i];
      if (!currentChar) {
        i++;
        return;
      }

      setTitleText((prev) => prev + currentChar);
      i++;
    }, 100); // 标题打字速度稍慢一些，更有仪式感

    return () => {
      if (titleTypingRef.current) clearInterval(titleTypingRef.current);
      if (titleHideTimeoutRef.current) clearTimeout(titleHideTimeoutRef.current);
    };
  }, []);

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
    <header className="fixed top-0 left-0 w-full
  bg-[var(--header-bg)] backdrop-blur-xl
  shadow-lg border-b border-[var(--header-border)] z-50">

      <div className="relative flex items-center w-full px-8 py-4">

        {/* 左：Logo（打字完成后隐藏） */}
        {!titleHidden && (
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-pink-400 dark:text-violet-400 tracking-wide">
              {titleText}
              {isTitleTyping && (
                <span className="animate-pulse text-[var(--text-primary)]">|</span>
              )}
            </h1>
          </div>
        )}

        {/* 中：时间 + 节日倒计时（一行常驻，绝对居中） */}
        <div
          suppressHydrationWarning
          className="absolute left-1/2 -translate-x-1/2 text-center max-w-[85%] truncate text-sm"
        >
          <span className="font-mono text-pink-400 dark:text-violet-400">{timeText}</span>
          <span className="mx-2 text-[var(--text-secondary)]">|</span>
          <span className="text-[var(--text-secondary)]">{countdownText}</span>
        </div>

        {/* 右：导航 */}
        <div className="flex-1 flex justify-end">
          {/* 桌面端导航 */}
          <nav className="hidden md:flex gap-6 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
            <Link href="/" className="hover:text-violet-500">首页</Link>
            <Link href="/articles" className="hover:text-violet-500">文章</Link>

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
        <div className="md:hidden bg-[var(--header-bg)] backdrop-blur-xl border-t border-[var(--header-border)]">
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