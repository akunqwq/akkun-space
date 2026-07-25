import type { Metadata } from "next";
import Image from "next/image";
import { Github, Globe, Tv, Sparkles, Rocket, Compass, Code2 } from "lucide-react";
import TagWall from "../components/TagWall";
import GlassPage from "../components/GlassPage";
import { interests } from "@/lib/interests";
import { techStack } from "@/lib/techStack";

export const metadata: Metadata = {
  title: "关于",
  description: "关于阿鲲与阿鲲の小窝",
};

// 正在探索：泛主题、长期稳定，无需频繁更新
const exploring = [
  "Next.js 全栈开发",
  "TypeScript 类型设计",
  "Vue3 生态",
  "Web 性能优化",
];

// Roadmap：稳定的项目目标，不是每周计划
const roadmap = [
  "Live2D 角色常驻",
  "评论 / 留言板优化",
  "媒体中心（音乐 / 视频）",
  "更多博客文章",
];

const socials = [
  { label: "Bilibili", href: "https://space.bilibili.com/286757068", icon: Tv },
  { label: "GitHub", href: "https://github.com/akunqwq", icon: Github },
  { label: "博客", href: "https://www.akkun.online", icon: Globe },
];

// 简单 chip 列表（避免 TagWall 的漂浮云样式影响可读性）
function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="px-3 py-1 rounded-full text-sm bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
        >
          {item}
        </span>
      ))}
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
    <GlassPage maxWidth="max-w-5xl">
      <div className="space-y-6">
      {/* 个人卡片 */}
      <section className="card flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6">
        <Image
          src="/avatar.jpg"
          alt="阿鲲的头像"
          width={96}
          height={96}
          className="w-24 h-24 rounded-2xl border-2 border-[var(--border-color)] object-cover shrink-0"
          title="干嘛！看什么看！"
        />
        <div className="text-center sm:text-left min-w-0">
          <h1 className="text-2xl font-bold text-[var(--accent)]">阿鲲</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            计算机应用技术 · Web 开发方向 · ACG 爱好者
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
            折腾代码、数码、音乐与游戏；在这里记录前端开发、技术探索与生活点滴。
          </p>
          <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
            {socials.map(({ label, href, icon: Icon }) => (
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
            ))}
          </div>
        </div>
      </section>

      {/* 兴趣 + 快速链接 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="我的兴趣" icon={Sparkles}>
          <ChipList items={interests} />
        </Section>
        <Section title="关于本站" icon={Globe}>
          <p className="leading-relaxed">
            <span className="text-[var(--text-primary)] font-medium">阿鲲の小窝</span>{" "}
            是我的个人博客，基于 Next.js 16 + React 19 + TypeScript + Tailwind v4 构建。
            MDX 管理内容，Supabase 存留言与互动数据，Vercel 部署。
            允许一点「花活」，但信息要可扫读。
          </p>
        </Section>
      </div>

      {/* 技术栈 + 正在探索 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="技术栈" icon={Code2}>
          <ChipList items={techStack} />
        </Section>
        <Section title="正在探索" icon={Compass}>
          <ChipList items={exploring} />
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

      {/* 彩蛋 · 兴趣云 */}
      <section className="card">
        <h2 className="text-center text-lg font-bold text-[var(--text-primary)] mb-2">
          ✨ 彩蛋 · 兴趣云 ✨
        </h2>
        <p className="text-center text-sm text-[var(--text-muted)] mb-4">
          漂浮的兴趣标签，重新刷新会洗牌
        </p>
        <div className="min-h-[280px]">
          <TagWall tags={interests} />
        </div>
      </section>
      </div>
    </GlassPage>
  );
}
