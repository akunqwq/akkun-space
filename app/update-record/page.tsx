import type { Metadata } from "next";
import UpdateRecordRenderer from "../components/UpdateRecordRenderer";
import GlassPage from "../components/GlassPage";
import { getUpdateRecords } from "@/lib/updateRecord";

export const metadata: Metadata = {
  title: "更新日志",
  description: "博客的迭代记录与更新情报",
};

export default function UpdateRecordPage() {
  const records = getUpdateRecords();

  return (
    <GlassPage maxWidth="max-w-[1400px]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">更新日志</h1>
      </div>

      {records && records.length > 0 ? (
        <UpdateRecordRenderer records={records} />
      ) : (
        <p className="text-center text-[var(--text-muted)]">暂无更新~</p>
      )}
    </GlassPage>
  );
}
