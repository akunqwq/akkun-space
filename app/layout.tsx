import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import Header from "./components/Header";
import MyCard from "./components/MyCard";
import Footer from "./components/Footer";
import RecentComments from "./components/RecentComments";
import StructuredData from "./components/StructuredData";
import SplashScreen from "./components/SplashScreen";
import { ThemeProvider } from "./components/ThemeProvider";
import { MediaProvider } from "./components/media/MediaProvider";
import FloatingThemeToggle from "./components/FloatingThemeToggle";
import FloatingActions from "./components/FloatingActions";
import FloatingEmojis from "./components/FloatingEmojis";
import GlobalHero, { type LobbyChannel } from "./components/GlobalHero";
import { getPostsIndex } from "../lib/posts";
import { getUpdates } from "../lib/updates";
import { mediaItems } from "../lib/media";
import { gameItems } from "../lib/games";

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
      default: "阿鲲 の小窝",
      template: "%s | 阿鲲 の小窝"
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
    keywords: [
      "阿鲲",
      "个人博客",
      "ACG",
      "二次元",
      "前端开发",
      "React",
      "Next.js",
      "TypeScript",
      "MMD",
      "原神",
      "是阿鲲酱鸭"
    ],
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
      title: "阿鲲 の小窝",
      description: finalDescription,
      url: '/',
      siteName: "阿鲲 の小窝",
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
      title: "阿鲲 の小窝",
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
  // 首页大堂的 Lobby 频道数据（与 GlobalHero 的 route-aware 配置共用）；
  // 在 server layout 中只算一次，传给 GlobalHero 作为 "/" 路由的轮播内容。
  const allPosts = getPostsIndex();
  const featuredPosts = allPosts.filter((p) => p.type !== "news");
  const homeChannels: LobbyChannel[] = [
    {
      key: "posts",
      label: "文章",
      eyebrow: "技术与随笔",
      title: "探索知识库",
      desc: "记录折腾、技术与生活的所思所想。",
      href: "/articles",
      image: "/bg1.jpg",
      featured: featuredPosts.slice(0, 3).map((p) => ({
        title: p.title,
        href: `/articles/${encodeURIComponent(p.slug)}`,
        meta: p.date,
        cover: p.cover,
      })),
    },
    {
      key: "music",
      label: "音乐",
      eyebrow: "音乐与律动",
      title: "听听我在听什么",
      desc: "ACG、纯音乐与 Galgame OST 歌单。",
      href: "/media/music",
      image: "/bg2.jpg",
      featured: mediaItems.slice(0, 3).map((m) => ({
        title: m.title,
        href: "/media/music",
        meta: m.artist,
        cover: m.cover,
      })),
    },
    {
      key: "games",
      label: "游戏",
      eyebrow: "游戏与ACG",
      title: "记录游戏时光",
      desc: "原神、崩铁与二次元同好的快乐。",
      href: "/games",
      image: "/images/genshin/gs_2026-01-22_000132_233.jpg",
      featured: gameItems.slice(0, 3).map((g) => ({
        title: g.name,
        href: g.postSlug ? `/articles/${encodeURIComponent(g.postSlug)}` : "/games",
        meta: g.status,
        cover: g.cover,
        emoji: "🎮",
      })),
    },
    {
      key: "changelog",
      label: "日志",
      eyebrow: "更新日志",
      title: "看看我在折腾什么",
      desc: "站点功能与版本演进记录。",
      href: "/changelog",
      image: "/bg3.jpg",
      featured: getUpdates()
        .slice(0, 3)
        .map((u) => ({
          title: u.title,
          href: `/changelog#${u.slug}`,
          meta: u.date,
          emoji: u.emoji,
        })),
    },
  ];

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
          <MediaProvider>
            <FloatingEmojis />
            <Header />
            <main className="pt-16 pb-16">
              {/* 全站唯一的背景/视觉承载层：路由感知，跨页面平滑交叉淡变 */}
              <GlobalHero homeChannels={homeChannels} />
              {children}
            </main>

            <Footer />
            <MyCard />
            <RecentComments />
            <FloatingThemeToggle />
            <FloatingActions />
          </MediaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
