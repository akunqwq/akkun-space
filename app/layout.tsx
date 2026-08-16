import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import Header from "./components/Header";
import Footer from "./components/Footer";
import RecentComments from "./components/RecentComments";
import GuestbookNotifier from "./components/GuestbookNotifier";
import StructuredData from "./components/StructuredData";
import SplashScreen from "./components/SplashScreen";
import { ThemeProvider } from "./components/ThemeProvider";
import { MusicProvider } from "./components/music/MusicProvider";
import FloatingThemeToggle from "./components/FloatingThemeToggle";
import FloatingActions from "./components/FloatingActions";
import FloatingEmojis from "./components/FloatingEmojis";
import GlobalHero, { type FeaturedItem, type LobbyChannel } from "./components/GlobalHero";
import { getPostsIndex } from "../lib/posts";
import { getUpdateRecords } from "../lib/updateRecord";
import { musicItems, DEFAULT_COVER } from "../lib/music";
import { gameItems, STATUS_LABELS } from "../lib/games";
import { heroChannels } from "../lib/hero";
import seoData from "../data/site/seo.json";

const geistSans = localFont({
  src: [
    { path: "./fonts/Geist/webfonts/Geist-Regular.woff2", weight: "400",style: "normal"},
    { path: "./fonts/Geist/webfonts/Geist-Bold.woff2", weight: "700",style: "normal"},
  ],
  variable: "--font-geist-sans",
});

const geistMono = localFont({
    src: [
    { path: "./fonts/GeistMono/webfonts/GeistMono-Regular.woff2", weight: "400",style: "normal"},
  ],
  variable: "--font-geist-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  // 固定描述，避免新闻搬运内容污染搜索引擎摘要
  const finalDescription = "阿鲲的个人博客，记录前端开发、技术探索、游戏与生活点滴。";

  return {
    title: {
      default: "阿鲲の小窝 - 主页",
      template: "阿鲲の小窝 - %s"
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },           
        { url: '/favicon-16x16.png', sizes: '16x16' }, 
        { url: '/favicon.png', sizes: '32x32', type: 'image/png' }, 
      ],
      apple: '/favicon.png',
    },
    description: finalDescription,
    keywords: seoData.keywords,
    authors: [{ name: "阿鲲" }],
    creator: "阿鲲",
    publisher: "阿鲲",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://www.akkun.online'), 
    alternates: {
      canonical: '/',
      languages: {
        'zh-CN': '/zh-CN',
        'en': '/en'
      }
    },
    openGraph: {
      title: "阿鲲の小窝",
      description: finalDescription,
      url: '/',
      siteName: "阿鲲の小窝",
      images: [
        {
          url: '/HeadIMG.jpg',
          width: 800,
          height: 800,
          alt: "阿鲲的头像",
        },
      ],
      locale: 'zh_CN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: "阿鲲の小窝",
      description: finalDescription,
      images: ['/HeadIMG.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: '782ba3cc522dd4f6'
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 首页大堂的 Lobby 频道：静态文案来自 data/site/hero.json（经 lib/hero.ts），
  // featured 精选列表在 server layout 运行时动态组装（posts / media / games / update-record），
  // 按频道 key 合并后传给 GlobalHero 作为 "/" 路由的轮播内容。
  const allPosts = getPostsIndex();
  const featuredPosts = allPosts.filter((p) => p.type !== "news");
  const featuredByKey: Record<string, FeaturedItem[]> = {
    posts: featuredPosts.slice(0, 3).map((p) => ({
      title: p.title,
      href: `/articles/${encodeURIComponent(p.slug)}`,
      meta: p.date,
      cover: p.cover,
    })),
    music: musicItems.slice(0, 3).map((m) => ({
      title: m.title,
      href: "/music",
      meta: m.artist,
      // Hero 预览缩略图用本地静态封面（public/music/cover/），避免直接暴露私有桶路径；
      // 实际播放时封面仍走 lib/music-url 的签名 URL（见 CoverImage）。无封面回退默认图。
      cover: m.cover ? `/music/cover/${m.cover.split("/").pop()}` : DEFAULT_COVER,
    })),
    games: gameItems.slice(0, 3).map((g) => ({
      title: g.title,
      href: "/games",
      meta: g.status ? STATUS_LABELS[g.status] : undefined,
      cover: g.cover,
      emoji: "🎮",
    })),
    updateRecord: getUpdateRecords()
      .slice(0, 3)
      .map((u) => ({
        title: u.title,
        href: `/update-record#${u.slug}`,
        meta: u.date,
        emoji: u.emoji,
      })),
  };
  const homeChannels: LobbyChannel[] = heroChannels.map((c) => ({
    ...c,
    featured: featuredByKey[c.key] ?? [],
  }));

  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <StructuredData type="website" />
        {/* 设置主题 */}
        <script
          id="set-theme"
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var key = 'theme';
                var saved = localStorage.getItem(key);
                // 1) 最高优先：用户手动选择的模式（localStorage 持久化）
                if (saved === 'dark' || saved === 'light') {
                  document.documentElement.classList.toggle('dark', saved === 'dark');
                  return;
                }
                // 2) 次高优先：系统/浏览器偏好；3) 保底默认：dark
                var dm = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
                var lm = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)');
                var prefersLight = !!(lm && lm.matches);
                // 系统明确要 light -> light；系统要 dark 或无偏好 -> dark（默认）
                document.documentElement.classList.toggle('dark', !prefersLight);
              } catch (e) { /* ignore */ }
            })();`,
          }}
        />
        {/* Splash 屏：非首页零闪烁隐藏；首页正常显示由 React 组件接管 */}
        <script
          id="splash-check"
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                if (location.pathname !== '/') {
                  document.documentElement.classList.add('splash-done');
                }
              } catch (e) { /* ignore */ }
            })();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 全局氛围光晕：固定的粉/紫/蓝弥散光球，营造沉浸式 ACG 背景。
            位于内容之下（-z-10），透过毛玻璃卡片可见，消除 Hero 与正文的断层感 */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        >
          <div className="absolute -top-32 -left-24 w-[30rem] h-[30rem] rounded-full bg-pink-400/20 dark:bg-pink-500/25 blur-[120px]" />
          <div className="absolute top-1/4 -right-24 w-[32rem] h-[32rem] rounded-full bg-purple-400/20 dark:bg-purple-500/25 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[26rem] h-[26rem] rounded-full bg-sky-400/12 dark:bg-indigo-500/20 blur-[120px]" />
        </div>

        <ThemeProvider>
          <SplashScreen />
          <MusicProvider>
            <FloatingEmojis />
            <Header />
            <main className="pt-16 pb-16">
              {/* 全站唯一的背景/视觉承载层：路由感知，跨页面平滑交叉淡变 */}
              <GlobalHero homeChannels={homeChannels} />
              {children}
            </main>

            <Footer />
            <GuestbookNotifier />
            <RecentComments />
            <FloatingThemeToggle />
            <FloatingActions />
          </MusicProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
