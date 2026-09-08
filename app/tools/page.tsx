import type { Metadata } from "next";
import Link from "next/link";
import { Search, BarChart3, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "工具",
  description:
    "阿鲲做的独立小工具集合：B 站 UP 主数据查询、游戏公司财报营收速查，免费、打开即用。",
};

const TOOLS = [
  {
    href: "/tools/bili-up",
    icon: Search,
    title: "B 站 UP 主数据查询",
    desc: "输入 UP 主 mid，实时查粉丝数、视频播放与三连数据。免费、打开即用。",
  },
  {
    href: "/tools/finance",
    icon: BarChart3,
    title: "游戏公司财报营收速查",
    desc: "按游戏营收降序查上市公司游戏业务营收与同比，结构化可对比。",
  },
];

export default function ToolsPage() {
  return (
    <>
      <section>
        <div className="flex items-baseline justify-center gap-3 mb-2">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            工具
          </h2>
          <span className="text-sm text-[var(--text-muted)]">
            {TOOLS.length} 个
          </span>
        </div>
        <p className="text-center text-sm text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
          窄场景、免费、打开即用的小工具。先跑通一个，再慢慢长成工具矩阵。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="group block rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/50 hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-xl bg-[var(--accent)]/12 p-3 text-[var(--accent)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
                      {t.title}
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </h3>
                    <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                      {t.desc}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
