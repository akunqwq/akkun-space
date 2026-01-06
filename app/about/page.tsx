import type { Metadata } from "next";
import TagWall from "../components/TagWall";
import UpdatesRenderer from "../components/UpdatesRenderer";
import Live2DWidget from "../components/Live2DWidget";
import { interests } from "@/lib/interests";
import { getUpdates } from "@/lib/updates";

export const metadata: Metadata = {
  title: "阿鲲 の小窝 - 关于",
  description: "关于阿鲲",
};

export default function AboutPage() {
  const updates = getUpdates();

  return (
    <div className="flex flex-col px-4 md:px-8 pt-24 md:pt-6 pb-6 gap-6">
      {/* 桌面端 Live2D 角色 - 固定在左下角 */}
      <div className="hidden md:block">
        <Live2DWidget />
      </div>

      {/* 桌面端三栏布局 */}
      <div className="hidden md:flex md:flex-row gap-6 justify-center">
        {/* 左侧栏 — 个人简介 */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-[var(--card-bg)] backdrop-blur-lg p-6 rounded-3xl shadow-sm border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold mb-4 text-center text-[var(--text-primary)]">关于本喵~</h2>
            <img
              src="/HeadIMG.jpg"
              title="我的设定"
              className="w-24 h-24 rounded-full mb-4 transition-transform duration-200 hover:scale-105 cursor-pointer border-2 border-white/50 object-cover mx-auto"
            />
            <p className="text-[var(--text-secondary)] leading-relaxed text-center">
              你好，我是阿鲲，一只正在学习 React 和 Tailwind 的鲲。
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
            兴趣标签
          </h3>
          <TagWall tags={interests} />
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
                <div className="w-16 h-28 flex-shrink-0">
                  <img src="/images/devices/mondrian.png" alt="手机" title="这是我的手机" className="w-full h-full object-cover rounded-2xl border border-white/50" />
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
          <img
            src="/HeadIMG.jpg"
            title="我的设定"
            className="w-24 h-24 rounded-full mb-4 transition-transform duration-200 hover:scale-105 cursor-pointer border-2 border-white/50 object-cover mx-auto"
          />
          <p className="text-[var(--text-secondary)] leading-relaxed text-center">
            你好，我是阿鲲，一只正在学习 React 和 Tailwind 的鲲。
          </p>
        </div>

        {/* 兴趣墙 */}
        <main className="backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--border-color)] p-6">
          <h3 className="text-xl font-bold text-center mb-4 text-[var(--text-primary)]">
            兴趣标签
          </h3>
          <TagWall tags={interests} />
        </main>

        {/* 我的动态 */}
        <div className="backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--border-color)] p-6">
          <h3 className="text-xl font-bold text-center mb-4 text-[var(--text-primary)]">
            我的动态
          </h3>
          <div className="mx-auto max-w-[720px] text-[var(--text-primary)]">
            {updates && updates.length > 0 ? (
              <UpdatesRenderer updates={updates} />
            ) : (
              <div className="text-center space-y-3">
                <p className="text-[var(--text-muted)]">
                  暂无动态...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 移动端挂件区 - Live2D 和右侧卡片水平对齐 */}
        <div className="flex gap-4">
          {/* Live2D 角色 - 左边 */}
          <Live2DWidget />

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
                  <div className="w-16 h-28 flex-shrink-0">
                    <img src="/images/devices/mondrian.png" alt="手机" title="这是我的手机" className="w-full h-full object-cover rounded-2xl border border-white/50" />
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

      {/* 桌面端我的动态 */}
      <div className="hidden md:flex md:flex-row gap-6 justify-center">
        <div className="w-full md:w-64 shrink-0"></div> {/* 占位，与左侧栏同宽 */}
        <div className="flex-1 max-w-[720px] mx-auto backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[var(--border-color)] p-6">
          <h3 className="text-xl font-bold text-center mb-4 text-[var(--text-primary)]">
            我的动态
          </h3>
          <div className="text-[var(--text-primary)]">
            {updates && updates.length > 0 ? (
              <UpdatesRenderer updates={updates} />
            ) : (
              <div className="text-center space-y-3">
                <p className="text-[var(--text-muted)]">
                  暂无动态...
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="w-56 shrink-0"></div> {/* 占位，与右侧栏同宽 */}
      </div>


    </div>
  );
}
