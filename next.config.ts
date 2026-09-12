/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  pageExtensions: ['tsx', 'ts', 'mdx', 'md'],
  // nodemailer 含动态 require 与可选原生依赖，交给 Node 直接 require，
  // 避免打包器处理时报 critical dependency 警告或破坏可选模块解析
  serverExternalPackages: ['nodemailer'],
  experimental: {
    mdxRs: {
      mdxType: 'gfm',
    },
  },
  images: {
    // B 站头像/视频封面 CDN 域名（工具区页面渲染 face/pic/cover 字段）
    remotePatterns: [
      { protocol: 'https', hostname: 'i0.hdslb.com' },
      { protocol: 'https', hostname: 'i1.hdslb.com' },
      { protocol: 'https', hostname: 'i2.hdslb.com' },
      { protocol: 'https', hostname: 'i3.hdslb.com' },
      { protocol: 'https', hostname: 'apiclick.biligame.net' },
    ],
  },
};

export default nextConfig;
