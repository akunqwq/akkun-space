"use client";

import { useEffect, useRef, useState } from "react";
import quotes from "@/lib/quotes.json";
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
  const [quote, setQuote] = useState("");
  const [displayedText, setDisplayedText] = useState(getCurrentTime());
  const [displayMode, setDisplayMode] = useState('time'); // 'time' | 'countdown' | 'quote'
  const [titleText, setTitleText] = useState(""); // 标题打字机效果
  const [isTitleTyping, setIsTitleTyping] = useState(false); // 标题打字状态
  const [isQuoteTyping, setIsQuoteTyping] = useState(false); // 名言打字状态
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 移动端菜单状态

  const mounted = useRef(false); // 标记客户端挂载完成
  const typingIntervalRef = useRef<number | null>(null);
  const rotationIntervalRef = useRef<number | null>(null);
  const titleTypingRef = useRef<number | null>(null);

  const fullTitle = "欢迎来到 阿鲲 の 个人 Blog";

  function splitGraphemes(str: string) {
    return Array.from(str.normalize("NFC"));
  }

  function cleanText(str: string) {
    return str
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
      .replace(/[\uE000-\uF8FF]/g, "")
      .replace(/[\uFFF0-\uFFFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
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
    };
  }, []);

  // 客户端挂载后启动轮换
  useEffect(() => {
    mounted.current = true;

    // 每次随机时，确保名言不会连续重复
    let currentIndex = Math.floor(Math.random() * quotes.length);
    const first = cleanText(quotes[currentIndex]);
    setQuote(first);

    // 启动轮换（每 4 秒）
    rotationIntervalRef.current = window.setInterval(() => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * quotes.length);
      } while (nextIndex === currentIndex && quotes.length > 1);
      
      currentIndex = nextIndex;
      const next = cleanText(quotes[nextIndex]);
      setQuote(next);
    }, 4000);

    return () => {
      mounted.current = false;
      if (rotationIntervalRef.current) clearInterval(rotationIntervalRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // 时间 → 倒计时 → 打字机效果循环
  useEffect(() => {
    // 服务端阶段不执行；客户端首屏替换时才执行
    if (!mounted.current) return;

    // 显示时间
    setDisplayMode('time');
    setDisplayedText(getCurrentTime());

    // 0.8秒后显示倒计时
    const countdownTimeout = setTimeout(() => {
      setDisplayMode('countdown');
      setDisplayedText(getCountdown());

      // 再过0.8秒后开始打字机效果
      const quoteTimeout = setTimeout(() => {
        setDisplayMode('quote');
        setDisplayedText("");
        setIsQuoteTyping(true);

        const chars = splitGraphemes(cleanText(quote));
        let i = 0;

        typingIntervalRef.current = window.setInterval(() => {
          if (i >= chars.length) {
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
            setIsQuoteTyping(false);
            return;
          }

          const currentChar = chars[i];
          if (!currentChar) {
            i++;
            return;
          }

          setDisplayedText((prev) => prev + currentChar);
          i++;
        }, 40);
      }, 800);

      return () => clearTimeout(quoteTimeout);
    }, 800);

    return () => {
      clearTimeout(countdownTimeout);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, [quote]);

  return (
    <header className="fixed top-0 left-0 w-full
  bg-[var(--header-bg)] backdrop-blur-xl
  shadow-lg border-b border-[var(--header-border)] z-50">

      <div className="flex items-center w-full px-8 py-4">

        {/* 左：Logo */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-pink-300 dark:text-pink-400 tracking-wide">
            {titleText}
            {isTitleTyping && (
              <span className="animate-pulse text-[var(--text-primary)]">|</span>
            )}
          </h1>
        </div>

        {/* 中：每日名言 */}
        <div className="flex-1 text-center">
          <p suppressHydrationWarning
            className={`text-sm ${displayMode === 'time' || displayMode === 'countdown'
              ? "text-pink-300 dark:text-pink-400 font-mono"
              : "text-[var(--text-primary)]"
              }`}
          >
            {displayedText}
            {displayMode === 'quote' && isQuoteTyping && (
              <span className="animate-pulse">|</span>
            )}
          </p>
        </div>

        {/* 右：导航 */}
        <div className="flex-1 flex justify-end">
          {/* 桌面端导航 */}
          <nav className="hidden md:flex gap-6 text-pink-300 dark:text-pink-400">
            <a href="/" className="hover:text-pink-500">首页</a>
            <a href="/wallpapers" className="hover:text-pink-500">壁纸</a>
            <a href="/articles" className="hover:text-pink-500">专栏</a>

            <a href="/about" className="hover:text-pink-500">关于本喵</a>
          </nav>

          {/* 移动端汉堡菜单 */}
          <button
            className="md:hidden text-pink-300 dark:text-pink-400 focus:outline-none"
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

            <a
              href="/"
              className="text-pink-300 dark:text-pink-400 hover:text-pink-500 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              首页
            </a>
            <a
              href="/wallpapers"
              className="text-pink-300 dark:text-pink-400 hover:text-pink-500 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              壁纸
            </a>
            <a
              href="/articles"
              className="text-pink-300 dark:text-pink-400 hover:text-pink-500 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              专栏
            </a>


            <a
              href="/about"
              className="text-pink-300 dark:text-pink-400 hover:text-pink-500 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              关于本喵
            </a>
          </nav>
        </div>
      )}
    </header>

  );
}