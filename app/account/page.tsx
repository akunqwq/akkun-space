import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/session';
import LogoutButton from '@/app/components/auth/LogoutButton';

export const metadata: Metadata = {
  title: '我的账号',
  description: '阿鲲の小窝账号中心。',
  // 账号页无内容价值，禁止索引
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  // middleware 已按 cookie 存在性拦截；此处真实校验兜住"cookie 残留但会话已失效"
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=%2Faccount');

  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--panel-shadow-sm)]">
        <h2 className="text-center text-xl font-bold text-[var(--text-primary)]">
          我的账号
        </h2>
        <p className="mt-1.5 mb-5 text-center text-sm text-[var(--text-secondary)]">
          已登录
        </p>

        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3">
          <div className="text-xs text-[var(--text-muted)]">账号名</div>
          <div className="mt-0.5 break-all font-mono text-sm text-[var(--text-primary)]">
            {user.username}
          </div>
          {user.email && (
            <>
              <div className="mt-2 text-xs text-[var(--text-muted)]">邮箱</div>
              <div className="mt-0.5 break-all font-mono text-sm text-[var(--text-primary)]">
                {user.email}
              </div>
            </>
          )}
          <div className="mt-2 text-xs text-[var(--text-muted)]">
            注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}
          </div>
        </div>

        {/* 个人化功能（收藏 / 订阅 / 历史）后续版本接入，此处先立骨架 */}
        <div className="mt-5">
          <LogoutButton />
        </div>
      </div>
    </section>
  );
}
