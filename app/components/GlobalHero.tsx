"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export interface FeaturedItem {
  title: string;
  href: string;
  meta?: string;
  cover?: string;
  emoji?: string;
}

export interface LobbyChannel {
  key: string;
  label: string; // 文字 Tab：文章 / 音乐 / 游戏 / 日志
  eyebrow: string; // 小标签：技术与随笔
  title: string; // 大标题：探索知识库
  desc: string; // 副描述
  href: string; // 整块点击跳转
  image: string; // 背景图
  featured: FeaturedItem[]; // 精选推荐（随频道切换）
}

// 路由感知的「单页 Hero」配置（子页面 / 兜底用）
interface RouteHero {
  eyebrow: string;
  title: string;
  desc: string;
  href: string;
  image: string;
  featured?: FeaturedItem[];
}

// 根据 pathname 解析 Hero 配置：
//   /            → Lobby 轮播（首页大堂）
//   其余路由      → 单页静态 Hero（背景大图 + 文案 + CTA）
// 这样 GlobalHero 在 layout 中只挂载一次，跨路由切换时由 HeroBackground 做平滑交叉淡变。
function resolveHero(
  pathname: string,
  homeChannels: LobbyChannel[]
): { kind: "lobby"; channels: LobbyChannel[] } | { kind: "single"; hero: RouteHero } {
  if (pathname === "/") {
    return { kind: "lobby", channels: homeChannels };
  }
  if (pathname.startsWith("/articles")) {
    return {
      kind: "single",
      hero: {
        eyebrow: "文字与思考",
        title: "我的文章库",
        desc: "技术、折腾与生活随笔，记录每一次探索与踩坑。",
        href: "/articles",
        image: "/bg1.jpg",
      },
    };
  }
  if (pathname.startsWith("/media")) {
    return {
      kind: "single",
      hero: {
        eyebrow: "音乐与律动",
        title: "正在播放",
        desc: "ACG / 纯音乐 / Galgame OST，切页不中断。",
        href: "/media/music",
        image: "/bg2.jpg",
      },
    };
  }
  if (pathname.startsWith("/games")) {
    return {
      kind: "single",
      hero: {
        eyebrow: "游戏与ACG",
        title: "游戏记录与存档",
        desc: "原神、崩铁与二次元同好的快乐时光。",
        href: "/games",
        image: "/images/genshin/gs_2026-01-22_000132_233.jpg",
      },
    };
  }
  if (pathname.startsWith("/changelog")) {
    return {
      kind: "single",
      hero: {
        eyebrow: "更新日志",
        title: "看看我在折腾什么",
        desc: "站点功能与版本演进记录。",
        href: "/changelog",
        image: "/bg3.jpg",
      },
    };
  }
  if (pathname.startsWith("/about")) {
    return {
      kind: "single",
      hero: {
        eyebrow: "关于本喵",
        title: "关于阿鲲",
        desc: "计算机应用技术 · Web 开发 · ACG 爱好者。",
        href: "/about",
        image: "/bg1.jpg",
      },
    };
  }
  // 兜底：未知路由也给一个干净的全屏 Hero
  return {
    kind: "single",
    hero: {
      eyebrow: "阿鲲の小窝",
      title: "欢迎来到我的小窝",
      desc: "记录前端开发、技术探索、游戏与生活点滴。",
      href: "/",
      image: "/bg1.jpg",
    },
  };
}

// 跨路由 / 跨轮播的平滑交叉淡变背景：
// 维护一个图层栈（最多 2 层），新图 enter 先 0 透明度、下一帧翻成 100 做淡入，
// 旧图停留在底层淡出，过渡结束后清理多余层。
function HeroBackground({ image }: { image: string }) {
  const [layers, setLayers] = useState<{ src: string; id: number; enter: boolean }[]>([
    { src: image, id: 0, enter: true },
  ]);
  const idRef = useRef(1);

  // 图片变化时新增一层（保留旧层做淡出）
  useEffect(() => {
    setLayers((prev) => {
      const last = prev[prev.length - 1];
      if (last.src === image) return prev;
      const id = idRef.current++;
      const next = prev.map((l) => ({ ...l, enter: false }));
      return [...next, { src: image, id, enter: true }];
    });
  }, [image]);

  // 新层挂载后一帧翻成可见，触发淡入过渡
  useEffect(() => {
    if (!layers.some((l) => l.enter)) return;
    const t = setTimeout(() => {
      setLayers((prev) => prev.map((l) => ({ ...l, enter: false })));
    }, 30);
    return () => clearTimeout(t);
  }, [layers]);

  // 过渡结束后清理多余层，只留当前
  useEffect(() => {
    const t = setTimeout(() => {
      setLayers((prev) => (prev.length > 1 ? prev.slice(-1) : prev));
    }, 1100);
    return () => clearTimeout(t);
  }, [image]);

  return (
    <>
      {layers.map((l) => (
        <Image
          key={l.id}
          src={l.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ease-in-out ${
            l.enter ? "opacity-0" : "opacity-100"
          }`}
        />
      ))}
    </>
  );
}

// 平滑下滚锚点：点击平滑滚动到内容面板（z-30 浮于玻璃面板之上）
function SmoothScrollButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({
          top: window.innerHeight - 100,
          behavior: reduce ? "auto" : "smooth",
        });
      }}
      aria-label="向下滚动查看内容"
      className="absolute bottom-28 md:bottom-40 left-1/2 -translate-x-1/2 z-30 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all animate-bounce motion-reduce:animate-none cursor-pointer"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </button>
  );
}

function FeaturedList({ items }: { items: FeaturedItem[] }) {
  return (
    <div className="hero-feat-anim mt-8 max-w-md">
      <p className="text-white/50 text-[11px] font-medium tracking-[0.25em] uppercase mb-3">
        精选推荐
      </p>
      <ul className="space-y-1.5">
        {items.map((f) => (
          <li key={f.href + f.title}>
            <Link
              href={f.href}
              className="group/i flex items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 hover:bg-white/10 transition-colors"
            >
              {f.cover ? (
                // 小缩略图用原生 img：封面可能是本地路径或远程(picsum) URL，避免 next/image 远程域名配置
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.cover}
                  alt=""
                  className="w-9 h-9 rounded-md object-cover shrink-0"
                />
              ) : (
                <span className="flex items-center justify-center w-9 h-9 rounded-md bg-white/15 text-white/80 text-sm shrink-0">
                  {f.emoji ?? "·"}
                </span>
              )}
              <span className="flex-1 min-w-0 truncate text-sm text-white/90 group-hover/i:text-white">
                {f.title}
              </span>
              {f.meta && (
                <span className="text-xs text-white/45 shrink-0">{f.meta}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 首页大堂：分栏大图轮播 + 文字 Tab + 精选推荐（动态切换）
function LobbyHero({ channels }: { channels: LobbyChannel[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (dir: number) =>
      setIndex((i) => (i + dir + channels.length) % channels.length),
    [channels.length]
  );

  // 自动轮播：悬停暂停；index 变化（手动或自动）都会重置计时，避免手动切换后突兀跳变
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % channels.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, channels.length, index]);

  const active = channels[index];

  return (
    <>
      {/* 背景交叉淡变：由 HeroBackground 统一处理（轮播切换也平滑） */}
      <HeroBackground image={active.image} />

      {/* 可读性遮罩：底部 + 左侧渐变，保证文字在任何背景图上清晰 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent" />

      {/* 内容区（左对齐，垂直居中） */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 pb-28 sm:pb-24">
          {/* 频道大标题块 —— key 触发切换动画 */}
          <Link href={active.href} className="group/cta block max-w-2xl">
            <p
              key={active.key + "-e"}
              className="hero-title-anim text-[var(--accent)] text-sm md:text-base font-semibold tracking-[0.2em] uppercase mb-3"
            >
              {active.eyebrow}
            </p>
            <h1
              key={active.key + "-t"}
              className="hero-title-anim text-white text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] drop-shadow-xl"
            >
              {active.title}
            </h1>
            <p
              key={active.key + "-d"}
              className="hero-title-anim text-white/80 mt-3 text-base md:text-lg max-w-xl"
            >
              {active.desc}
            </p>
            <span className="hero-title-anim mt-5 inline-flex items-center gap-1.5 text-white font-semibold text-sm md:text-base group-hover/cta:gap-2.5 transition-all">
              进入频道
              <span aria-hidden className="text-lg">
                →
              </span>
            </span>
          </Link>

          {/* 精选推荐 —— 随频道动态切换 */}
          <FeaturedList key={active.key + "-f"} items={active.featured} />
        </div>
      </div>

      {/* 左右箭头（桌面 hover 显隐，提供侧边点击切换） */}
      <button
        type="button"
        aria-label="上一个频道"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition hover:bg-black/50"
      >
        <span className="text-2xl leading-none">‹</span>
      </button>
      <button
        type="button"
        aria-label="下一个频道"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition hover:bg-black/50"
      >
        <span className="text-2xl leading-none">›</span>
      </button>

      {/* 文字 Tab 指示器（替换原 dots）：点击直接切换频道 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-1 rounded-full bg-black/30 backdrop-blur-md p-1 border border-white/10">
        {channels.map((c, i) => (
          <button
            key={c.key}
            type="button"
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              i === index
                ? "bg-[var(--accent)] text-white shadow"
                : "text-white/80 hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <SmoothScrollButton />
    </>
  );
}

// 子页面 / 兜底：单页静态 Hero（背景大图 + 文案 + CTA）
function SingleHero({ hero }: { hero: RouteHero }) {
  return (
    <>
      <HeroBackground image={hero.image} />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent" />

      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 pb-28 sm:pb-24">
          <Link href={hero.href} className="group/cta block max-w-2xl">
            <p className="hero-title-anim text-[var(--accent)] text-sm md:text-base font-semibold tracking-[0.2em] uppercase mb-3">
              {hero.eyebrow}
            </p>
            <h1 className="hero-title-anim text-white text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] drop-shadow-xl">
              {hero.title}
            </h1>
            <p className="hero-title-anim text-white/80 mt-3 text-base md:text-lg max-w-xl">
              {hero.desc}
            </p>
            <span className="hero-title-anim mt-5 inline-flex items-center gap-1.5 text-white font-semibold text-sm md:text-base group-hover/cta:gap-2.5 transition-all">
              进入{hero.eyebrow}
              <span aria-hidden className="text-lg">
                →
              </span>
            </span>
          </Link>

          {hero.featured && hero.featured.length > 0 && (
            <FeaturedList key="single-f" items={hero.featured} />
          )}
        </div>
      </div>

      <SmoothScrollButton />
    </>
  );
}

export default function GlobalHero({ homeChannels }: { homeChannels: LobbyChannel[] }) {
  const pathname = usePathname();
  const resolved = resolveHero(pathname, homeChannels);

  return (
    <div className="group relative w-full h-svh overflow-hidden -mt-16">
      {resolved.kind === "lobby" ? (
        <LobbyHero channels={resolved.channels} />
      ) : (
        <SingleHero hero={resolved.hero} />
      )}
    </div>
  );
}
