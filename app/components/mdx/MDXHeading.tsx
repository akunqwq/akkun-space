import React from 'react';

interface MDXHeadingProps {
  children?: React.ReactNode;
  level?: 1 | 2 | 3;
  [key: string]: unknown;
}

/**
 * MDX 标题组件
 * 统一 h1-h3 的样式，支持滚动定位（scroll-mt-24）
 */
export default function MDXHeading({ children, level = 2, ...props }: MDXHeadingProps) {
  const baseClass = "font-semibold mt-4 mb-2 text-[var(--text-primary)] scroll-mt-24";

  const styles: Record<number, string> = {
    1: "text-3xl font-bold mt-8 mb-4 text-center",
    2: "text-2xl mt-6 mb-3 text-center",
    3: "text-xl mt-4 mb-2",
  };

  const className = `${baseClass} ${styles[level] || styles[2]}`;

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag className={className} {...props}>
      {children}
    </Tag>
  );
}
