"use client";

import { useState } from "react";

export default function MyCard() {
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div
            className={`
    fixed bottom-4 md:bottom-8
    ${isCollapsed ? '-left-20 md:left-4 md:right-8 md:left-auto' : 'left-4 md:left-8 md:right-8 md:left-auto'}
    flex items-center gap-4 md:gap-6
    bg-[var(--card-bg)] backdrop-blur-lg
    p-3 md:p-6 rounded-3xl
    hover:shadow-xl
    transition-all duration-300
    flex flex-row-reverse md:flex-row
    ${!isCollapsed ? 'z-[80] md:z-[60]' : 'z-[60]'}
    cursor-pointer
    border border-[var(--border-color)]
  `}
            onClick={() => {
                if (!isCollapsed) {
                    window.open('https://space.bilibili.com/286757068', '_blank');
                }
            }}
        >
            {/* 移动端收起按钮 */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(!isCollapsed);
                }}
                className="md:hidden absolute -right-2 top-1/2 -translate-y-1/2 bg-[var(--card-bg)] backdrop-blur-sm rounded-full p-1 shadow-md hover:bg-[var(--card-bg-hover)] border border-[var(--border-color)]"
                title={isCollapsed ? "展开" : "收起"}
            >
                <svg 
                    className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* 移动端：右侧文本，桌面端：左侧文本 */}
            <div className={`${isCollapsed ? 'md:block hidden' : ''} text-right md:text-left`} title="点击跳转到我的bilibili主页~">
                <h1 className="text-lg md:text-2xl font-bold text-[var(--text-primary)]">
                    你好，我是阿鲲
                </h1>
                <p className="text-sm md:text-base text-[var(--text-secondary)] mt-1">
                    这里是我的博客 🌸
                </p>
            </div>

            {/* 移动端：左侧头像，桌面端：右侧头像 */}
            <img
                src="/avatar.jpg"
                alt="头像"
                title="干嘛！看什么看！"
                className="
      w-16 h-16 md:w-20 md:h-20 rounded-full
      border-2 border-[var(--border-color)]
      object-cover
      hover:scale-105 transition
    "
            />
        </div>
    );
}