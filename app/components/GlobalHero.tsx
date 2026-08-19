"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getRouteHero } from "@/lib/hero";
import CoverImage from "./music/CoverImage";

export interface FeaturedItem {
  title: string;
  href: string;
  meta?: string;
  cover?: string;
  emoji?: string;
  coverSigned?: boolean;
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
// 文案数据源：data/site/hero.json（channels 按 prefix 匹配 page + fallback 兜底）。
// 这样 GlobalHero 在 layout 中只挂载一次，跨路由切换时由 HeroBackground 做平滑交叉淡变。
function resolveHero(
  pathname: string,
  homeChannels: LobbyChannel[]
): { kind: "lobby"; channels: LobbyChannel[] } | { kind: "single"; hero: RouteHero } {
  if (pathname === "/") {
    return { kind: "lobby", channels: homeChannels };
  }
  return { kind: "single", hero: getRouteHero(pathname) };
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

function FeaturedList({ items }: { items: FeaturedItem[] }) {
  return (
    <div className="hero-feat-anim mt-8 max-w-md">
      <p className="text-[var(--hero-text-muted)] text-[11px] font-medium tracking-[0.25em] uppercase mb-3">
        精选推荐
      </p>
      <ul className="space-y-1.5">
        {items.map((f) => (
          <li key={f.href + f.title}>
            <Link
              href={f.href}
              className="group/i flex items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 hover:bg-[var(--hero-item-hover)] transition-colors"
            >
              {f.cover ? (
                f.coverSigned ? (
                  <CoverImage
                    item={{ title: f.title, cover: f.cover }}
                    className="w-9 h-9 rounded-md object-cover shrink-0"
                  />
                ) : (
                  // 小缩略图用原生 img：封面可能是本地路径或远程(picsum) URL，避免 next/image 远程域名配置
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.cover}
                    alt=""
                    className="w-9 h-9 rounded-md object-cover shrink-0"
                  />
                )
              ) : (
                <span className="flex items-center justify-center w-9 h-9 rounded-md bg-[var(--hero-badge-bg)] text-[var(--hero-badge-text)] text-sm shrink-0">
                  {f.emoji ?? "·"}
                </span>
              )}
              <span className="flex-1 min-w-0 truncate text-sm text-[var(--hero-text-secondary)] group-hover/i:text-[var(--hero-text-primary)]">
                {f.title}
              </span>
              {f.meta && (
                <span className="text-xs text-[var(--hero-text-weak)] shrink-0">{f.meta}</span>
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

      {/* 可读性遮罩：底部 + 左侧渐变（dark 模式由 --hero-overlay-* 提供黑色渐变保证文字可读；
          light 模式变量为 transparent，原图直出） */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--hero-overlay-bottom)] via-[var(--hero-overlay-mid)] to-[var(--hero-overlay-top)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--hero-overlay-side)] via-[var(--hero-overlay-top)] to-transparent" />

      {/* 内容区（左对齐，垂直居中；顶部预留 --hero-safe-top 避让悬浮 Header） */}
      <div className="absolute inset-0 flex items-center pt-[var(--hero-safe-top)]">
        <div className="relative w-full max-w-[1400px] mx-auto px-8 pb-28 sm:pb-24">
          {/* 频道大标题块 —— key 触发切换动画；整块可点击跳转 */}
          <Link href={active.href} className="group/cta block max-w-2xl">
            <p
              key={active.key + "-e"}
              className="hero-title-anim text-[var(--accent)] text-sm md:text-base font-semibold tracking-[0.2em] uppercase mb-3"
            >
              {active.eyebrow}
            </p>
            <h1
              key={active.key + "-t"}
              className="hero-title-anim text-[var(--hero-text-primary)] text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] drop-shadow-xl"
            >
              {active.title}
            </h1>
            <p
              key={active.key + "-d"}
              className="hero-title-anim text-[var(--hero-text-secondary)] mt-3 text-base md:text-lg max-w-xl"
            >
              {active.desc}
            </p>
            {/* 首页保留「进入频道」CTA；子页面（SingleHero）按需移除不显示 */}
            <span className="hero-title-anim mt-5 inline-flex items-center gap-1.5 text-[var(--hero-text-primary)] font-semibold text-sm md:text-base group-hover/cta:gap-2.5 transition-all">
              进入频道
              <span aria-hidden className="text-lg">
                →
              </span>
            </span>
          </Link>

          {/* 精选推荐 —— 随频道动态切换 */}
          <FeaturedList key={active.key + "-f"} items={active.featured} />

          {/* Apple 式分页胶囊：依附于 Hero「内容块」定位（随内容走），而非外层 h-svh 容器；滚动离开 Hero 即随内容一起消失 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-1.5rem)] flex gap-1 overflow-x-auto rounded-full bg-[var(--hero-pill-bg)] backdrop-blur-md p-1 border border-[var(--hero-pill-border)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {channels.map((c, i) => (
              <button
                key={c.key}
                type="button"
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium transition-colors sm:px-4 sm:py-1.5 sm:text-sm ${
                  i === index
                    ? "bg-[var(--accent)] text-white shadow"
                    : "text-[var(--hero-text-secondary)] hover:text-[var(--hero-text-primary)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 左右箭头（桌面 hover 显隐，提供侧边点击切换） */}
      <button
        type="button"
        aria-label="上一个频道"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-[var(--hero-arrow-bg)] text-[var(--hero-text-primary)] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition hover:bg-[var(--hero-arrow-hover)]"
      >
        <span className="text-2xl leading-none">‹</span>
      </button>
      <button
        type="button"
        aria-label="下一个频道"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-[var(--hero-arrow-bg)] text-[var(--hero-text-primary)] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition hover:bg-[var(--hero-arrow-hover)]"
      >
        <span className="text-2xl leading-none">›</span>
      </button>
    </>
  );
}

// 子页面 / 兜底：单页静态 Hero（背景大图 + 文案；不显示「进入」CTA，仅整块可点击跳转）
function SingleHero({ hero }: { hero: RouteHero }) {
  return (
    <>
      <HeroBackground image={hero.image} />

      {/* 可读性遮罩：同首页（dark 保留黑色渐变，light 透明原图直出） */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--hero-overlay-bottom)] via-[var(--hero-overlay-mid)] to-[var(--hero-overlay-top)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--hero-overlay-side)] via-[var(--hero-overlay-top)] to-transparent" />

      <div className="absolute inset-0 flex items-center pt-[var(--hero-safe-top)]">
        <div className="w-full max-w-[1400px] mx-auto px-8 pb-28 sm:pb-24">
          <Link href={hero.href} className="block max-w-2xl">
            <p className="hero-title-anim text-[var(--accent)] text-sm md:text-base font-semibold tracking-[0.2em] uppercase mb-3">
              {hero.eyebrow}
            </p>
            <h1 className="hero-title-anim text-[var(--hero-text-primary)] text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] drop-shadow-xl">
              {hero.title}
            </h1>
            <p className="hero-title-anim text-[var(--hero-text-secondary)] mt-3 text-base md:text-lg max-w-xl">
              {hero.desc}
            </p>
          </Link>

          {hero.featured && hero.featured.length > 0 && (
            <FeaturedList key="single-f" items={hero.featured} />
          )}
        </div>
      </div>
    </>
  );
}

export default function GlobalHero({ homeChannels }: { homeChannels: LobbyChannel[] }) {
  const pathname = usePathname();
  const resolved = resolveHero(pathname, homeChannels);

  return (
    <div className="group relative w-full min-h-[85svh] overflow-hidden -mt-16">
      {resolved.kind === "lobby" ? (
        <LobbyHero channels={resolved.channels} />
      ) : (
        <SingleHero hero={resolved.hero} />
      )}
      {/* 底部渐隐：Hero 图融入页面背景，让上浮的玻璃内容自然融合（消除硬切边） */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent z-[5]" />
    </div>
  );
}
