import type { ReactNode } from 'react';

/* 下划线强调组件*/
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
