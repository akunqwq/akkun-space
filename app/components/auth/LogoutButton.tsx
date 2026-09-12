// app/components/auth/LogoutButton.tsx
// -----------------------------------------------------------------------------
// 退出登录按钮（Client Component）：POST /api/auth/logout → 回登录页。
// -----------------------------------------------------------------------------
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-all duration-200 hover:border-red-400/50 hover:text-red-500 disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      退出登录
    </button>
  );
}
