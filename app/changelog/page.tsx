import type { Metadata } from "next";
import UpdatesRenderer from "../components/UpdatesRenderer";
import { getUpdates } from "@/lib/updates";

export const metadata: Metadata = {
  title: "更新日志",
  description: "博客的迭代记录与更新情报",
};

export default function ChangelogPage() {
  const updates = getUpdates();

  return (
    <div className="flex flex-col px-4 md:px-8 pt-24 md:pt-6 pb-6 gap-6 max-w-[820px] mx-auto">
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
    </div>
  );
}
