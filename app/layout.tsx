import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import Header from "./components/Header";
import MyCard from "./components/MyCard";
import Footer from "./components/Footer";
import RecentComments from "./components/RecentComments";
import StructuredData from "./components/StructuredData";
import { ThemeProvider } from "./components/ThemeProvider";
import FloatingThemeToggle from "./components/FloatingThemeToggle";
import FloatingActions from "./components/FloatingActions";
import FloatingEmojis from "./components/FloatingEmojis";
import Script from "next/script";

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
                if (saved === 'dark') { document.documentElement.classList.add('dark'); }
                else if (saved === 'light') { document.documentElement.classList.remove('dark'); }
                else {
                  var mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
                  if (mql && mql.matches) document.documentElement.classList.add('dark');
                }
              } catch (e) { /* ignore */ }
            })();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <FloatingEmojis />
          <Header />
          <main className="pt-16 pb-16">
            {children}
          </main>

          <Footer />
          <MyCard />
          <RecentComments />
          <FloatingThemeToggle />
          <FloatingActions />
        </ThemeProvider>
      </body>
    </html>
  );
}
