import type { Metadata } from "next";
import Image from "next/image";
import {
  gameItems,
  STATUS_LABELS,
  type GameItem,
  type GameStatus,
} from "../../lib/games";
import GlassPage from "../components/GlassPage";

export const metadata: Metadata = {
  title: "游戏库",
  description:
    "记录我玩过、正在游玩与喜爱的游戏，也为未来的 Web 游戏项目预留一席之地。",
};

// 游戏状态角标样式
const STATUS_BADGE = "absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/55 text-white backdrop-blur-sm";

export default function GamesPage() {
  return (
    <GlassPage maxWidth="max-w-[1400px]">
      <section>
        <div className="flex items-baseline justify-center gap-3 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            我现在玩的游戏
          </h2>
          <span className="text-sm text-[var(--text-muted)]">
            {gameItems.length} 款
          </span>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-6">
          {gameItems.map((g) => (
            <GamePoster key={g.id} game={g} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-center justify-center gap-3 mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            我的游戏项目
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent)]/15 text-[var(--accent)]">
            Coming Soon
          </span>
        </div>
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg-subtle)] px-6 py-12 text-center">
          <p className="text-[var(--text-secondary)]">敬请期待...</p>
        </div>
      </section>
    </GlassPage>
  );
}


function GamePoster({ game }: { game: GameItem }) {
  const status = game.status as GameStatus | undefined;
  return (
    <article className="group relative rounded-xl overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:border-[var(--accent)]/50">
      <div className="relative aspect-[616/353] bg-black/20 overflow-hidden">
        {game.cover ? (
          <Image
            src={game.cover}
            alt={game.title}
            fill
            sizes="(max-width:640px) 90vw, 260px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            🎮
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {status && (
          <span className={STATUS_BADGE}>{STATUS_LABELS[status]}</span>
        )}
      </div>

      {/* 信息区 */}
      <div className="p-3">
        <h3 className="font-semibold text-[var(--text-primary)] truncate">
          {game.title}
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
          {game.platform}
          {game.source ? ` · ${game.source}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {game.genres.map((genre) => (
            <span
              key={genre}
              className="px-2 py-0.5 rounded-md text-[11px] bg-[var(--card-bg-subtle)] text-[var(--text-secondary)] border border-[var(--card-border-inset)]"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
