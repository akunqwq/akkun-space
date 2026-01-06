import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import Header from "./components/Header";
import ProfileCard from "./components/ProfileCard";
import Footer from "./components/Footer";
import RecentComments from "./components/RecentComments";
import StructuredData from "./components/StructuredData";
import { ThemeProvider } from "./components/ThemeProvider";
import FloatingThemeToggle from "./components/FloatingThemeToggle";
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

export const metadata: Metadata = {
  title: {
    default: "阿鲲 の小窝",
    template: "%s | 阿鲲 の小窝"
  },
  icons: {
    icon: '/favicon.png', 
    shortcut: '/favicon-16x16.png',
  },
  description: "阿鲲の小窝 - 一个专注于 ACG、前端技术和二次元文化的个人博客。分享 React、Next.js、TypeScript 等技术学习心得，以及生活感悟和创作作品。",
  keywords: [
    "阿鲲",
    "个人博客",
    "ACG",
    "二次元",
    "前端开发",
    "React",
    "Next.js",
    "TypeScript",
    "技术博客",
    "MMD",
    "原神",
    "生活记录"
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
    description: "一个专注于 ACG、前端技术和二次元文化的个人博客",
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
    description: "一个专注于 ACG、前端技术和二次元文化的个人博客",
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
    google: 'your-google-verification-code', // 可选：Google Search Console 验证码
    yandex: 'your-yandex-verification-code', // 可选：Yandex 验证码
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <StructuredData type="website" />
        {/* 在 React 之前执行，避免闪烁 */}
        <Script id="set-theme" strategy="beforeInteractive">
          {`(function(){
            try {
              var key = 'theme';
              var saved = localStorage.getItem(key);
              if (saved === 'dark') { document.documentElement.classList.add('dark'); return; }
              if (saved === 'light') { document.documentElement.classList.remove('dark'); return; }
              var mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
              if (mql && mql.matches) document.documentElement.classList.add('dark');
            } catch (e) { /* ignore */ }
          })();`}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Header />
          <main className="pt-16 pb-16">
            {children}
          </main>

          <Footer />
          <ProfileCard />
          <RecentComments />
          <FloatingThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
