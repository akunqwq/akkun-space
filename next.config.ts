/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false, // 👈 彻底关闭 Next.js 开发工具栏 / Dev Indicator
  pageExtensions: ['tsx', 'ts', 'mdx', 'md'],
  experimental: {
    mdxRs: {
      mdxType: 'gfm', // 启用 GitHub 风格 Markdown 支持
    },
  },
};

export default nextConfig;