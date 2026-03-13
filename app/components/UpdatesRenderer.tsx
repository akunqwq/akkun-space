import { MDXRemote } from 'next-mdx-remote/rsc';
import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import Link from 'next/link';
import ClientCodeBlock from './ClientCodeBlock';
import type { Update } from '@/lib/updates';
import { formatDate } from '@/lib/formatDate';

// 专门为动态内容设计的 MDX 组件映射
const updatesComponents: MDXComponents = {
  // 自定义图片组件 - 更紧凑的样式
  img: ({ src, alt, ...props }) => {
    if (!src) return null;

    const imageSrc = src.startsWith('/') ? src : `/${src}`;

    return (
      <Image
        src={imageSrc}
        alt={alt || ''}
        width={600}
        height={300}
        className="rounded-lg shadow-sm my-4 max-w-full h-auto"
        title={alt || ''}
        {...props}
      />
    );
  },

  // 自定义链接组件
  a: ({ href, children, ...props }) => {
    const isExternal = href?.startsWith('http');

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2"
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        href={href || ''}
        className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2"
        {...props}
      >
        {children}
      </Link>
    );
  },

  // 代码块 - 更紧凑的样式
  pre: ({ children, ...props }) => {
    const child = children?.props;
    const code = child?.children || "";
    const className = child?.className || "";

    return <ClientCodeBlock className={className}>{code}</ClientCodeBlock>;
  },

  // 行内代码 - 更小的字体
  code: ({ children, className, ...props }) => {
    if (className?.includes('language-')) {
      return <code {...props}>{children}</code>;
    }

    return (
      <code
        className="text-xs font-mono text-slate-700 dark:text-yellow-200
          bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600"
        {...props}
      >
        {children}
      </code>
    );
  },

  // 引用块 - 更简洁的样式
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="bg-[var(--blockquote-bg)] border-l-4 border-blue-400 pl-3 pr-2 py-3 my-4 text-[var(--text-primary)] rounded-r text-sm text-left overflow-x-auto whitespace-nowrap"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // 标题 - 更小的字体和间距
  h1: ({ children, ...props }) => (
    <h1
      className="text-xl font-bold mt-4 mb-2 text-[var(--text-primary)]"
      {...props}
    >
      {children}
    </h1>
  ),

  h2: ({ children, ...props }) => (
    <h2
      className="text-lg font-semibold mt-3 mb-2 text-[var(--text-primary)]"
      {...props}
    >
      {children}
    </h2>
  ),

  h3: ({ children, ...props }) => (
    <h3
      className="text-base font-semibold mt-2 mb-1 text-[var(--text-primary)]"
      {...props}
    >
      {children}
    </h3>
  ),

  // 列表项 - 更紧凑的样式
  li: ({ children, ...props }) => (
    <li
      className="leading-relaxed text-[var(--text-primary)] text-sm mb-1"
      {...props}
    >
      {children}
    </li>
  ),

  // 列表 - 更紧凑的样式
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside my-2 space-y-1 text-sm" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside my-2 space-y-1 text-sm" {...props}>
      {children}
    </ol>
  ),

  // 表格 - 更紧凑的样式
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border-collapse border border-[var(--border-color)] text-sm" {...props}>
        {children}
      </table>
    </div>
  ),

  thead: ({ children, ...props }) => (
    <thead className="bg-[var(--card-bg)]" {...props}>
      {children}
    </thead>
  ),

  tbody: ({ children, ...props }) => (
    <tbody className="bg-[var(--background)]" {...props}>
      {children}
    </tbody>
  ),

  tr: ({ children, ...props }) => (
    <tr className="transition-colors" {...props}>
      {children}
    </tr>
  ),

  th: ({ children, ...props }) => (
    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-[var(--border-color)]" {...props}>
      {children}
    </th>
  ),

  td: ({ children, ...props }) => (
    <td className="px-3 py-2 whitespace-nowrap text-xs border border-[var(--border-color)]" {...props}>
      {children}
    </td>
  ),

  // iframe - 更小的尺寸
  iframe: ({ src, title, ...props }) => (
    <iframe
      src={src}
      title={title || ''}
      className="w-full aspect-video rounded-lg shadow-sm my-3"
      frameBorder="0"
      allowFullScreen
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      {...props}
    />
  ),

  // 段落 - 更小的字体和间距
  p: ({ children, ...props }) => (
    <p className="my-2 leading-relaxed text-[var(--text-primary)] text-sm" {...props}>
      {children}
    </p>
  ),
};

interface UpdatesRendererProps {
  source?: string;
  updates?: Update[];
}

// 单个动态卡片组件
function UpdateCard({ update }: { update: Update }) {
  return (
    <div className="updates-card bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--border-color)] rounded-xl p-4 mb-3">
      {/* 动态标题栏 */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-color)]">
        {update.emoji && <span className="text-xl">{update.emoji}</span>}
        <h3 className="text-base font-bold text-[var(--text-primary)]">{update.title}</h3>
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          {formatDate(update.date)}
        </span>
      </div>

      {/* 动态内容 */}
      <div className="updates-content">
        <MDXRemote source={update.bodyRaw} components={updatesComponents} />
      </div>
    </div>
  );
}

export default function UpdatesRenderer({ source, updates }: UpdatesRendererProps) {
  // 如果传入单个 source，保持向后兼容
  if (source) {
    return (
      <div className="updates-content space-y-2">
        <MDXRemote source={source} components={updatesComponents} />
      </div>
    );
  }

  // 如果传入 updates 数组，渲染多个动态卡片
  if (updates && updates.length > 0) {
    return (
      <div className="space-y-3">
        {updates.map((update) => (
          <UpdateCard key={update.slug} update={update} />
        ))}
      </div>
    );
  }

  return null;
}