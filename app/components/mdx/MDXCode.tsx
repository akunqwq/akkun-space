import ClientCodeBlock from '../ClientCodeBlock';

interface MDXCodeProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * MDX 代码块组件
 * 将 pre > code 结构转换为 Shiki 高亮的代码块
 */
export default function MDXCode({ children, className }: MDXCodeProps) {
  const child =
    children && typeof children === "object" && "props" in children
      ? (children as React.ReactElement<{ children?: string; className?: string }>).props
      : undefined;
  const code = child?.children || "";
  const langClassName = child?.className || className || "";

  return <ClientCodeBlock className={langClassName}>{code}</ClientCodeBlock>;
}
