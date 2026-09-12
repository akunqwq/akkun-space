// proxy.ts
// -----------------------------------------------------------------------------
// 路由白名单拦截（Next 16：原 middleware 约定更名为 proxy，Edge Runtime）。
// 职责边界：只做 cookie 存在性检查（Edge 里无法用 node:crypto 查库验签），
// 真实会话校验在页面层 getCurrentUser() 兜底——cookie 残留但会话已失效时，
// /account 页面层会再次 redirect /login，双保险。
//
// 拦截策略（阿鲲 2026-09-09 决策）：白名单 + 渐进解锁。
//   - tools / 首页等公开内容不拦，保住 SEO 与 PLG 流量
//   - 文章「游客仅最新 3 篇」：列表层（/articles 页）截断展示 + proxy 深链拦截双保险。
//     proxy 的游客可见 slug 由 data/posts.json 运行期计算（发布时间倒序取最新 3 篇非 news），
//     与列表层同源；本文件同时管"必须登录才能进"的路由（/account）与文章深链软锁。
// -----------------------------------------------------------------------------
import { NextResponse, type NextRequest } from 'next/server';

import postsIndex from './data/posts.json';

const SESSION_COOKIE = 'ak_session';


const PROTECTED_PREFIXES = ['/account'];


const GUEST_VISIBLE_COUNT = 3;
const GUEST_VISIBLE_SLUGS: readonly string[] = postsIndex.posts
  .filter((p) => p.type !== 'news')
  .sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;
    return (b.order ?? 0) - (a.order ?? 0);
  })
  .slice(0, GUEST_VISIBLE_COUNT)
  .map((p) => p.slug);

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function redirectLogin(req: NextRequest, nextPath: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('next', nextPath);
  return NextResponse.redirect(url);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // 未登录访问受保护路由 → /login?next=原路径
  if (isProtected(pathname) && !hasSession) {
    return redirectLogin(req, pathname);
  }

  // 游客访问文章详情：非「最新 3 篇」（发布时间倒序、排除 news）→ 真 307 跳登录。
  // 可见 slug 由 data/posts.json 运行期计算（非构建期快照），页面层 getCurrentUser 仍保留双保险。
  if (!hasSession && pathname.startsWith('/articles/')) {
    let slug = pathname.slice('/articles/'.length);
    try {
      slug = decodeURIComponent(slug);
    } catch {
      // 异常编码：宁可误锁不可误放，走下方非白名单分支
    }
    if (slug && !GUEST_VISIBLE_SLUGS.includes(slug)) {
      return redirectLogin(req, pathname);
    }
  }

  // 已登录访问 /login → 直接回账号页
  if (pathname === '/login' && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/account';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/articles/:path*', '/login'],
};
