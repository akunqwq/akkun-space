import type { Metadata } from "next";
import Image from "next/image";
import TagWall from "../components/TagWall";
import { interests } from "@/lib/interests";
import { techStack } from "@/lib/techStack";

export const metadata: Metadata = {
  title: "关于",
  description: "关于阿鲲",
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
  "评论 / 留言板",
  "多设备适配",
  "更多博客文章",
];

// 简单 chip 列表（避免 TagWall 的漂浮云样式影响可读性）
function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="px-3 py-1 rounded-full text-sm bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="flex flex-col px-4 md:px-8 pt-24 md:pt-6 pb-6 gap-6">
      {/* 桌面端三栏布局 */}
      <div className="hidden md:flex md:flex-row gap-6 justify-center">
        {/* 左侧栏 — 个人简介 */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-3xl shadow-sm border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold mb-4 text-center text-[var(--text-primary)]">关于本喵~</h2>
            <div className="relative w-24 h-24 rounded-full mb-4 mx-auto">
              <Image
                src="/HeadIMG.jpg"
                alt="阿鲲的头像"
                title="我的设定"
                fill
                className="rounded-full transition-transform duration-200 hover:scale-105 cursor-pointer border-2 border-white/50 object-cover"
              />
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed text-center">
              你好，我是阿鲲，一名计算机应用技术专业学生，喜欢 Web 开发、软件折腾和各种数码设备。
            </p>
          </div>
        </aside>

        {/* 中间主内容 - 兴趣墙 */}
        <main
          className="
            flex-1
            max-w-[720px]
            mx-auto
            backdrop-blur-xl
            rounded-2xl
            shadow-[0_4px_20px_rgba(0,0,0,0.05)]
            border border-[var(--border-color)]
            p-6
          "
        >
          <h3 className="text-xl font-bold text-center mb-4 text-[var(--text-primary)]">
            我的兴趣
          </h3>
          <ChipList items={interests} />
        </main>

        {/* 右侧栏 — 挂件区 */}
        <aside className="w-56 shrink-0 flex flex-col gap-4 justify-start">
          <div className="p-4 bg-[var(--card-bg)] backdrop-blur-lg rounded-3xl shadow-sm border border-[var(--border-color)]">
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">个人名片</h4>
            <p className="text-[var(--text-secondary)]">这里可以放成就、签名、社交链接等</p>
          </div>

          <div className="p-6 bg-[var(--card-bg)] backdrop-blur-lg rounded-3xl shadow-sm border border-[var(--border-color)]">
            <h4 className="font-semibold text-[var(--text-primary)] mb-4">我的装备:</h4>

            {/* 设备列表布局 */}
            <div className="space-y-4">
              {/* 设备卡片 */}
              <a
                href="https://baike.baidu.com/item/%E7%BA%A2%E7%B1%B3K60/62490114"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-4 block transition-transform duration-200 hover:scale-105"
              >
                <div className="relative w-16 h-28 flex-shrink-0">
                  <Image src="/images/devices/mondrian.png" alt="手机" title="这是我的手机" fill className="w-full h-full object-cover rounded-2xl border border-white/50" />
                </div>
                <div className="flex-1 leading-tight">
                  <h5 className="font-semibold text-[var(--text-primary)] whitespace-nowrap">Redmi K60</h5>
                  <p className="text-sm text-[var(--text-secondary)] mt-1 text-center">16+256GB</p>
                </div>
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* 移动端布局 */}
      <div className="md:hidden space-y-6">
        {/* 个人简介 */}
        <div className="bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-3xl shadow-sm border border-[var(--border-color)]">
          <h2 className="text-xl font-semibold mb-4 text-center text-[var(--text-primary)]">关于本喵~</h2>
          <div className="relative w-24 h-24 rounded-full mb-4 mx-auto">
            <Image
              src="/HeadIMG.jpg"
              alt="阿鲲的头像"
              title="我的设定"
              fill
              className="rounded-full transition-transform duration-200 hover:scale-105 cursor-pointer border-2 border-white/50 object-cover"
            />
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed text-center">
            你好，我是阿鲲，一名计算机应用技术专业学生，喜欢 Web 开发、软件折腾和各种数码设备。
          </p>
        </div>

        {/* 兴趣墙 */}
        <main className="backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--border-color)] p-6">
          <h3 className="text-xl font-bold text-center mb-4 text-[var(--text-primary)]">
            我的兴趣
          </h3>
          <ChipList items={interests} />
        </main>

        {/* 移动端挂件区 - 右侧卡片 */}
        <div className="flex gap-4">
          {/* 右侧挂件区 - 右边 */}
          <div className="flex flex-col gap-4 justify-start ml-auto" style={{ maxWidth: '224px' }}>
            <div className="p-4 bg-[var(--card-bg)] backdrop-blur-lg rounded-3xl shadow-sm border border-[var(--border-color)]">
              <h4 className="font-semibold text-[var(--text-primary)] mb-2">个人名片</h4>
              <p className="text-[var(--text-secondary)]">这里可以放成就、签名、社交链接等</p>
            </div>

            <div className="p-6 bg-[var(--card-bg)] backdrop-blur-lg rounded-3xl shadow-sm border border-[var(--border-color)]">
              <h4 className="font-semibold text-[var(--text-primary)] mb-4">我的装备:</h4>

              {/* 设备列表布局 */}
              <div className="space-y-4">
                {/* 设备卡片 */}
                <a
                  href="https://baike.baidu.com/item/%E7%BA%A2%E7%B1%B3K60/62490114"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-4 block transition-transform duration-200 hover:scale-105"
                >
                <div className="relative w-16 h-28 flex-shrink-0">
                  <Image src="/images/devices/mondrian.png" alt="手机" title="这是我的手机" fill className="w-full h-full object-cover rounded-2xl border border-white/50" />
                </div>
                  <div className="flex-1 leading-tight">
                    <h5 className="font-semibold text-[var(--text-primary)] whitespace-nowrap">Redmi K60</h5>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 text-center">16+256GB</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 静态内容区：博客介绍 / 技术栈 / 正在探索 / Roadmap（桌面 + 移动通用） */}
      <div className="max-w-[720px] w-full mx-auto space-y-6">
        {/* 博客介绍 */}
        <section className="backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--border-color)] p-6">
          <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">博客介绍</h3>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            这是我的个人博客，用于记录学习过程、项目实践和踩坑经验。主打 ACG 风格，想到啥做啥，
            边做边上线，随时可能翻车，但也在不断进化。
          </p>
        </section>

        {/* 技术栈 */}
        <section className="backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--border-color)] p-6">
          <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">技术栈</h3>
          <ChipList items={techStack} />
        </section>

        {/* 正在探索 */}
        <section className="backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--border-color)] p-6">
          <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">正在探索</h3>
          <ChipList items={exploring} />
        </section>

        {/* Roadmap */}
        <section className="backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--border-color)] p-6">
          <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">Roadmap</h3>
          <ChipList items={roadmap} />
          <p className="text-xs text-[var(--text-muted)] mt-3">
            稳定的项目目标，不写每周计划 ✌️
          </p>
        </section>

        {/* 彩蛋：漂浮兴趣云（纯装饰，不参与信息展示；桌面+移动通用） */}
        <section className="backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--border-color)] p-6">
          <h3 className="text-xl font-bold mb-3 text-center text-[var(--text-primary)]">✨ 彩蛋 · 兴趣云 ✨</h3>
          <TagWall tags={interests} />
        </section>
      </div>
    </div>
  );
}
