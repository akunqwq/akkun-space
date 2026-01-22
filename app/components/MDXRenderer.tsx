import { MDXRemote } from 'next-mdx-remote/rsc';
import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import Link from 'next/link';
import ClientCodeBlock from './ClientCodeBlock';

// 自定义 MDX 组件映射
const mdxComponents: MDXComponents = {
  // 自定义图片组件
  img: ({ src, alt, ...props }) => {
    if (!src) return null;

    // 如果是相对路径，转换为绝对路径
    const imageSrc = src.startsWith('/') ? src : `/${src}`;

    return (
      <Image
        src={imageSrc}
        alt={alt || ''}
        width={800}
        height={400}
        className="rounded-lg shadow-md my-6"
        title={alt || ''}
        {...props}
      />
    );
  },

  // 自定义链接组件
  a: ({ href, children, ...props }) => {
    const isExternal = href?.startsWith('http');

    const linkClass = "text-[var(--link-color)] hover:text-[var(--link-hover)] underline underline-offset-2 decoration-[var(--link-underline)] hover:decoration-[var(--link-underline-hover)] transition-all duration-200";

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          {...props}
        >
          {children}
          <span className="ml-1 text-xs">↗</span>
        </a>
      );
    }

    return (
      <Link
        href={href || ''}
        className={linkClass}
        {...props}
      >
        {children}
      </Link>
    );
  },

  // 代码块 - 使用 Shiki 高亮
  pre: ({ children, ...props }) => {
    const child = children?.props;
    const code = child?.children || "";
    const className = child?.className || "";

    return <ClientCodeBlock className={className}>{code}</ClientCodeBlock>;
  },

  // 行内代码
code: ({ children, className, ...props }) => {
  // 跳过代码块中的 code 元素
  if (className?.includes('language-')) {
    return <code {...props}>{children}</code>;  // 原样返回
  }

  return (
    <code
      className="text-sm font-mono text-[var(--link-color)] bg-[var(--card-bg)] px-2 py-1 rounded-md border border-[var(--border-color)] shadow-sm"
      {...props}
    >
      {children}
    </code>
  );
},
  // 引用块
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-pink-400 bg-[var(--blockquote-bg)] pl-4 pr-3 py-4 my-6 italic text-[var(--text-primary)] rounded-r-lg shadow-sm sm:pl-6 sm:pr-4"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // 标题
  h1: ({ children, ...props }) => (
    <h1
      className="text-3xl font-bold mt-8 mb-4 text-[var(--text-primary)]"
      {...props}
    >
      {children}
    </h1>
  ),

  h2: ({ children, ...props }) => (
    <h2
      className="text-2xl font-semibold mt-6 mb-3 text-[var(--text-primary)] text-center"
      {...props}
    >
      {children}
    </h2>
  ),

  h3: ({ children, ...props }) => (
    <h3
      className="text-xl font-semibold mt-4 mb-2 text-[var(--text-primary)]"
      {...props}
    >
      {children}
    </h3>
  ),
  li: ({ children, ...props }) => (
  <li
    className="leading-relaxed text-[var(--text-primary)] text-lg"
    {...props}
  >
    {children}
  </li>
),
  // 列表
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside my-4 space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside my-4 space-y-2" {...props}>
      {children}
    </ol>
  ),
  // 表格容器 - 提供横向滚动
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse border border-[var(--border-color)]" {...props}>
        {children}
      </table>
    </div>
  ),

  // 表头
  thead: ({ children, ...props }) => (
    <thead className="bg-[var(--card-bg)]" {...props}>
      {children}
    </thead>
  ),

  // 表格主体
  tbody: ({ children, ...props }) => (
    <tbody className="bg-[var(--background)]" {...props}>
      {children}
    </tbody>
  ),

  // 表格行
  tr: ({ children, ...props }) => (
    <tr className=" transition-colors" {...props}>
      {children}
    </tr>
  ),

  // 表头单元格
  th: ({ children, ...props }) => (
    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border text-[var(--text-primary)]" {...props}>
      {children}
    </th>
  ),

  // 表格数据单元格
  td: ({ children, ...props }) => (
    <td className="px-6 py-4 whitespace-nowrap text-sm border" {...props}>
      {children}
    </td>
  ),

  // iframe 组件支持（用于视频嵌入）
  iframe: ({ src, title, ...props }) => (
    <iframe
      src={src}
      title={title || ''}
      className="w-full aspect-video rounded-lg shadow-lg"
      frameBorder="0"
      allowFullScreen
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      {...props}
    />
  ),

  // 段落
  p: ({ children, ...props }) => (
    <p className="my-4 leading-relaxed text-[var(--text-primary)] text-lg" {...props}>
      {children}
    </p>
  ),
};

interface MDXRendererProps {
  source: string;
}

export default function MDXRenderer({ source }: MDXRendererProps) {
  return (
    <MDXRemote source={source} components={mdxComponents} />
  );
}