import type { Metadata } from "next";
import UpdatesRenderer from "../components/UpdatesRenderer";
import GlassPage from "../components/GlassPage";
import { getUpdates } from "@/lib/updates";

export const metadata: Metadata = {
  title: "更新日志",
  description: "博客的迭代记录与更新情报",
};

export default function ChangelogPage() {
  const updates = getUpdates();

  return (
    <GlassPage maxWidth="max-w-[820px]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">更新日志</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          记录博客的成长与踩坑 ✨
        </p>
      </div>

      {updates && updates.length > 0 ? (
        <UpdatesRenderer updates={updates} />
      ) : (
        <p className="text-center text-[var(--text-muted)]">暂无更新~</p>
      )}
    </GlassPage>
  );
}
