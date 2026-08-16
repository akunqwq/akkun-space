/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  pageExtensions: ['tsx', 'ts', 'mdx', 'md'],
  experimental: {
    mdxRs: {
      mdxType: 'gfm', 
    },
  },
};

export default nextConfig;