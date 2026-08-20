import { MDXRemote } from 'next-mdx-remote/rsc';
import type { MDXComponents } from 'mdx/types';
// 导入拆分后的子组件
import MDXCode from './mdx/MDXCode';
import MDXImage from './mdx/MDXImage';
import MDXLink from './mdx/MDXLink';
import MDXHeading from './mdx/MDXHeading';
import MDXBlockquote from './mdx/MDXBlockquote';
import Underline from './mdx/Underline';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

/**
 * MDX 组件映射配置
 * 集中管理所有自定义 MDX 元素的渲染逻辑
 */
const mdxComponents: MDXComponents = {
  // 自定义组件（已拆分为独立文件）
  Underline,
  img: MDXImage,
  a: MDXLink,
  pre: MDXCode,
  h1: (props) => <MDXHeading level={1} {...props} />,
  h2: (props) => <MDXHeading level={2} {...props} />,
  h3: (props) => <MDXHeading level={3} {...props} />,
  blockquote: MDXBlockquote,

  // 行内代码
  code: ({ children, className, ...props }) => {
    // 跳过代码块中的 code 元素
    if (className?.includes('language-')) {
      return <code {...props}>{children}</code>;
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

  // 列表项
  li: ({ children, ...props }) => (
    <li
      className="leading-relaxed text-[var(--text-primary)] text-lg"
      {...props}
    >
      {children}
    </li>
  ),

  // 列表容器
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

  // 表格元素
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
    <tr className=" transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border text-[var(--text-primary)]" {...props}>
      {children}
    </th>
  ),
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
      className="w-full aspect-video rounded-lg shadow-lg min-h-[500px]"
      frameBorder="0"
      allowFullScreen
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      {...props}
    />
  ),

  // 段落
  p: ({ children, style, ...props }) => (
    <p className="my-4 leading-relaxed text-[var(--text-primary)] text-lg" {...props}>
      {children}
    </p>
  ),
};

interface MDXRendererProps {
  source: string;
}

/**
 * MDX 渲染器主组件
 * 职责：组装组件映射 + 配置插件，委托给 MDXRemote 执行渲染
 */
export default function MDXRenderer({ source }: MDXRendererProps) {
  return (
    <MDXRemote
      source={source}
      components={mdxComponents}
      options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
    />
  );
}
