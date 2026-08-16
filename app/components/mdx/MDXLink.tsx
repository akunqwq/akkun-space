import Link from 'next/link';

interface MDXLinkProps {
  href?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

/**
 * MDX 链接组件
 * 内部链接使用 Next.js Link，外部链接添加 target="_blank"
 */
export default function MDXLink({ href, children, ...props }: MDXLinkProps) {
  const isExternal = href?.startsWith('http');

  const linkClass = "text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2 decoration-[var(--accent)] hover:decoration-[var(--accent-hover)] transition-all duration-200";

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
}
