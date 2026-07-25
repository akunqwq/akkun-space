"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// 时序：硬刷新 vs SPA 路由切回首页
const DELAY_RELOAD = 1200; // 硬刷新首页：品牌驻留
const DELAY_SPA = 400;     // SPA 切回首页：极速过渡
const EXIT_DURATION = 400; // 退出动画时长，匹配 CSS

const KEY_EVER = "catkun-ever-visited"; // localStorage：跨会话区分首访/回访

/**
 * SplashScreen — 双模触发
 *
 * ① 浏览器硬刷新 / 首次进站（Hard Reload）：
 *    DELAY_RELOAD(1200ms) + 首访 splashReveal(blur+scale 高光) / 回访 splashEnter(轻量)
 * ② SPA 路由从子页切回 / 首页：
 *    DELAY_SPA(400ms) + splashEnter(轻量)
 *
 * 非首页（pathname !== "/"）不展示。
 * 退出后 return null 彻底卸载 DOM。
 */
export default function SplashScreen() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"visible" | "exiting" | "done">(
    "visible",
  );
  const [entrance, setEntrance] = useState<"reveal" | "light">("reveal");
  const isInitialMount = useRef(true);

  useEffect(() => {
    // 消费 initial mount 标记（无论是否首页，第一次 effect run 即算硬刷新）
    const wasInitial = isInitialMount.current;
    isInitialMount.current = false;

    // 非首页不展示
    if (pathname !== "/") {
      setPhase("done");
      return;
    }

    // 尊重 reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }

    // 决定入场动画 + 时长
    let duration: number;
    let ent: "reveal" | "light";
    if (wasInitial) {
      // 硬刷新：首访用高光 reveal，回访用轻量
      const isFirst = (() => {
        try {
          return !localStorage.getItem(KEY_EVER);
        } catch {
          return true;
        }
      })();
      ent = isFirst ? "reveal" : "light";
      duration = DELAY_RELOAD;
      try {
        localStorage.setItem(KEY_EVER, "1");
      } catch {
        /* ignore */
      }
    } else {
      // SPA 路由切回首页：轻量极速
      ent = "light";
      duration = DELAY_SPA;
    }

    setEntrance(ent);
    setPhase("visible");

    let doneTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    Promise.all([
      new Promise<void>((r) => setTimeout(r, duration)),
      document.fonts.ready,
    ]).then(() => {
      if (cancelled) return;
      setPhase("exiting");
      doneTimer = setTimeout(() => {
        if (!cancelled) setPhase("done");
      }, EXIT_DURATION);
    });

    return () => {
      cancelled = true;
      clearTimeout(doneTimer);
    };
  }, [pathname]);

  // 状态机 done 时彻底卸载 DOM
  if (phase === "done") return null;

  return (
    <div
      className={`splash-overlay${phase === "exiting" ? " splash-exiting" : ""}`}
      aria-hidden="true"
      suppressHydrationWarning
    >
      <div className={`splash-content splash-${entrance}`}>
        {/* 站名 */}
        <div className="splash-title">
          <span className="text-[var(--text-primary)]">阿鲲</span>
          <span className="text-[var(--accent)]"> の小窝</span>
        </div>

        {/* 副标题 */}
        <p className="splash-subtitle">Welcome to my space</p>

        {/* 极细隐蔽 Loading 条 */}
        <div className="splash-loading-bar" />
      </div>
    </div>
  );
}
