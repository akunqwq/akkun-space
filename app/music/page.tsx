import { musicItems } from "@/lib/portfolio";
import MusicCard from "../components/music/MusicCard";
import GlassPage from "../components/GlassPage";
import { Lock } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "音乐库",
  description: "阿鲲の小窝 - 音乐库",
};

export default async function MusicPage() {
  // cookies() 介入 → 本页按请求动态渲染（区分登录态）
  const user = await getCurrentUser();

  return (
    <GlassPage maxWidth="max-w-[1400px]">
      <header className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          音乐库
        </h1>
        {user && (
          <>
            <p className="mt-2 text-[var(--text-secondary)]">
              从以下四首测试曲目选一首喜欢的点击播放吧！
            </p>
            <p className="mt-2 text-[var(--text-secondary)]">
              注明：仅供开发测试使用
            </p>
          </>
        )}
      </header>

      {user ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {musicItems.map((item, i) => (
            <MusicCard key={item.id} item={item} items={musicItems} index={i} />
          ))}
        </div>
      ) : (
        // 游客锁定卡：需登录后访问
        <div className="mt-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center">
          <Lock className="mx-auto h-6 w-6 text-[var(--text-muted)]" />
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            登录后可访问音乐库
          </p>
          <Link
            href="/login?next=%2Fmusic"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
          >
            登录 / 注册
          </Link>
        </div>
      )}
    </GlassPage>
  );
}
