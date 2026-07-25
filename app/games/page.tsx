import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { gameItems } from "../../lib/games";
import GlassPage from "../components/GlassPage";

export const metadata: Metadata = {
  title: "游戏与ACG · 阿鲲の小窝",
  description: "记录我的游戏时光：原神、崩铁与二次元同好。",
};

export default function GamesPage() {
  return (
    <GlassPage maxWidth="max-w-7xl">
      <header className="mb-8">
        <p className="text-[var(--accent)] text-sm font-semibold tracking-[0.2em] uppercase">
          游戏与ACG
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mt-2">
          记录游戏时光
        </h1>
        <p className="text-[var(--text-secondary)] mt-3 max-w-2xl leading-relaxed">
          提瓦特的风、星穹列车的旅程，以及和同好们一起的快乐。这里收录我正在玩 / 关注的作品，
          以及折腾建模、渲染与二创的碎片。
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {gameItems.map((g) => {
          const href = g.postSlug
            ? `/articles/${encodeURIComponent(g.postSlug)}`
            : "/games";
          return (
            <Link
              key={g.slug}
              href={href}
              className="group block rounded-2xl overflow-hidden bg-[var(--card-bg)] border border-white/10 hover:border-accent/50 transition-colors"
            >
              <div className="relative aspect-[4/3] bg-black/20">
                {g.cover ? (
                  <Image
                    src={g.cover}
                    alt={g.name}
                    fill
                    sizes="(max-width:640px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    🎮
                  </div>
                )}
                {g.status && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
                    {g.status}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h2 className="font-semibold text-[var(--text-primary)] truncate">
                  {g.name}
                </h2>
                {g.note && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                    {g.note}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </GlassPage>
  );
}
