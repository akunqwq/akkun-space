import type { Metadata } from 'next';

import LoginForm from '@/app/components/auth/LoginForm';

export const metadata: Metadata = {
  title: '登录',
  description: '登录阿鲲の小窝账号，查看全部文章与个人化功能。',
};

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  // open redirect 防护：next 必须是站内路径（/ 开头且非 //）
  const { next } = await searchParams;
  const nextPath =
    next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';

  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <LoginForm nextPath={nextPath} />
    </section>
  );
}
