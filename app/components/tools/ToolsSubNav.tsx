'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/tools', label: '工具首页' },
  { href: '/tools/bili-up', label: 'B 站 UP 主' },
  { href: '/tools/finance', label: '游戏财报' },
];

export default function ToolsSubNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {ITEMS.map((it) => {
        const active =
          pathname === it.href ||
          (it.href !== '/tools' && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              active
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50'
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
