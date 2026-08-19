import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Globe, Tv, Sparkles, Rocket, Compass, Code2 } from "lucide-react";
import TagWall from "../components/TagWall";
import GlassPage from "../components/GlassPage";
import { interests } from "@/lib/interests";
import { techStack } from "@/lib/techStack";
import { socials, getSocial } from "@/lib/socials";
import aboutData from "@/data/content/about.json";

export const metadata: Metadata = {
  title: "关于我",
  description: "关于站点作者阿鲲的个人介绍、兴趣爱好、技术栈与 Roadmap",
};

// 正在探索（泛主题、长期稳定）与 Roadmap（稳定项目目标）：data/content/about.json
const { exploring, roadmap } = aboutData;


function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}


const SOCIAL_ICONS: Record<string, React.ElementType> = {
  bilibili: Tv,
  github: GitHubIcon,
  blog: Globe,
};


const aboutSocials = socials.filter((s) => s.key in SOCIAL_ICONS && s.href);

const SEARCH_BASE = "https://cn.bing.com/search?q=";
const toSearchChip = (skill: string): ChipItem => ({
  label: skill,
  href: `${SEARCH_BASE}${encodeURIComponent(skill)}`,
});


export type ChipItem =
  | string
  | {
      label: string;
      href?: string;
      isExternal?: boolean;
      onClick?: () => void;
    };

function normalizeChip(item: ChipItem) {
  if (typeof item === "string") {
    return { label: item, href: undefined, isExternal: false, onClick: undefined };
  }
  const href = item.href;
  const isExternal = item.isExternal ?? /^https?:\/\//i.test(href ?? "");
  return { label: item.label, href, isExternal, onClick: item.onClick };
}

function ChipList({
  items,
  className = "",
  onItemClick,
}: {
  items: ChipItem[];
  className?: string;
  onItemClick?: (label: string, index: number) => void;
}) {
  const baseClass =
    "max-w-full inline-flex items-center px-3 py-1 rounded-full text-sm bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] truncate hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors";
  const clickableClass =
    "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((raw, index) => {
        const { label, href, isExternal, onClick } = normalizeChip(raw);
        const key = `${label}-${index}`;
        const handleClick =
          onClick ?? (onItemClick ? () => onItemClick(label, index) : undefined);
        const interactive = Boolean(href || handleClick);
        const classNames = interactive ? `${baseClass} ${clickableClass}` : baseClass;

        // 1) 外部链接 → <a> 标签
        if (href && isExternal) {
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              className={classNames}
            >
              {label}
            </a>
          );
        }
        // 2) 内部链接 → <Link> 标签
        if (href) {
          return (
            <Link key={key} href={href} title={label} className={classNames}>
              {label}
            </Link>
          );
        }
        // 可点击 → <button>
        if (handleClick) {
          return (
            <button
              key={key}
              type="button"
              title={label}
              onClick={handleClick}
              className={classNames}
            >
              {label}
            </button>
          );
        }
        // 展示 → <span>
        return (
          <span key={key} title={label} className={classNames}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)] mb-3">
        <Icon className="w-5 h-5 text-[var(--accent)]" />
        {title}
      </h2>
      <div className="text-[var(--text-secondary)]">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <GlassPage maxWidth="max-w-[1400px]">
      <div className="space-y-6">
      {/* 个人卡片 */}
      <section className="card flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6">
        <Image
          src="/avatar.jpg"
          alt="头像"
          width={96}
          height={96}
          className="w-24 h-24 rounded-2xl border-2 border-[var(--border-color)] object-cover shrink-0"
          title="兄弟，点杯蜜雪冰城吗？"
        />
        <div className="text-center sm:text-left min-w-0">
          <h1 className="text-2xl font-bold text-[var(--accent)]">阿鲲</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            计算机应用技术 - 应届毕业生 - 前端开发工程师 - 技术爱好者
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
            折腾代码、数码、音乐、动漫、游戏、电影、摄影、旅行等。捣鼓折腾各种新技术，追求高效与极简的生活方式。
          </p>
          <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
            {aboutSocials.map(({ key, label, href }) => {
              const Icon = SOCIAL_ICONS[key];
              return (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* 兴趣标签 */}
      <section className="card">
        <h2 className="text-center text-lg font-bold text-[var(--text-primary)] mb-2">
          兴趣标签
        </h2>
        <div className="min-h-[280px]">
          <TagWall tags={interests.map(toSearchChip)} />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="我的兴趣" icon={Sparkles}>
          <ChipList items={interests.map(toSearchChip)} />
        </Section>
        <Section title="关于本站" icon={Globe}>
          <p className="leading-relaxed">
            <span className="text-[var(--text-primary)] font-medium">
          「阿鲲の小窝」</span>{" "}
            基于 Next.js、React 与 Tailwind CSS 等现代化技术栈打造。以 MDX 呈现文章内容，Supabase 提供数据支持，暂部署托管于 Vercel。
          </p>
          
            {(() => {
              const repo = getSocial("repo");
              return repo?.href ? (
                <>
                  <a
                    href={repo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline font-medium"
                  >
                    <GitHubIcon className="w-4 h-4" />
                    查看本站源码（Source Code）
                  </a>
                </>
              ) : null;
            })()}
       
        </Section>
      </div>

      {/* 技术栈 + 正在探索 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="技术栈" icon={Code2}>
          <ChipList items={techStack.map(toSearchChip)} />
        </Section>
        <Section title="正在探索" icon={Compass}>
          <ChipList items={exploring.map(toSearchChip)} />
        </Section>
      </div>

      {/* Roadmap */}
      <Section title="Roadmap" icon={Rocket}>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {roadmap.map((item, i) => (
            <li
              key={item}
              className="flex items-center gap-2 text-[var(--text-secondary)]"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-xs font-mono shrink-0">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Section>
      </div>
    </GlassPage>
  );
}
