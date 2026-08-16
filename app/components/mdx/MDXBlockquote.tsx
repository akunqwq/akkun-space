import React from 'react';

interface MDXBlockquoteProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

/**
 * MDX 引用块组件
 * 左侧彩色边框 + 背景色，支持暗色模式
 */
export default function MDXBlockquote({ children, ...props }: MDXBlockquoteProps) {
  return (
    <blockquote
      className="border-l-4 border-[var(--blockquote-border)] bg-[var(--blockquote-bg)] pl-4 pr-3 py-4 my-6 italic text-[var(--blockquote-text)] rounded-r-lg shadow-sm sm:pl-6 sm:pr-4"
      {...props}
    >
      {children}
    </blockquote>
  );
}
