import type { ReactNode } from 'react';

/**
 * 手绘风下划线强调组件。
 * 用法（MDX 中）：
 *   <Underline>需要划线的文字</Underline>
 * 颜色可通过 color 覆盖，默认 emerald-400。
 */
export default function Underline({
  children,
  color = 'bg-emerald-400',
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span className="relative inline-block">
      {children}
      <span
        className={`absolute left-0 bottom-[-2px] w-full h-[3px] rounded-full ${color}`}
        aria-hidden="true"
      />
    </span>
  );
}
