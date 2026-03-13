# 阿鲲の小窝

> 一个边做边上线的个人博客，随时可能翻车，但也在不断进化 ✨

ACG 风格个人博客，基于 Next.js 搭建，主打随心所欲、想到啥做啥。

---

## ✨ 功能概览

| 功能 | 说明 |
|------|------|
| **首页** | 全文章流展示，三栏布局（兴趣卡片 + 文章流 + 关注卡片） |
| **专栏** | 文章列表 `/articles`，支持封面、摘要、标签 |
| **文章详情** | `/articles/[slug]`，MDX 渲染，代码高亮 |
| **关于** | `/about` 个人介绍 |
| **壁纸墙** | `/wallpapers` 壁纸展示 |
| **主题** | 深色/浅色模式，跟随系统偏好 |
| **更新情报** | 站点动态（MyCard 弹窗内） |

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev
# http://localhost:3000

# 构建生产
npm run build
npm run start
```

---

## 📁 项目结构

```
my-blog/
├── app/                      # Next.js App Router
│   ├── page.tsx              # 首页
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # 全局样式
│   ├── articles/             # 专栏
│   │   ├── page.tsx          # 文章列表
│   │   └── [slug]/page.tsx   # 文章详情
│   ├── about/                # 关于页
│   ├── wallpapers/           # 壁纸页
│   ├── sitemap.xml/          # Sitemap 路由
│   ├── components/           # 页面组件
│   │   ├── Header.tsx        # 顶栏
│   │   ├── Footer.tsx        # 页脚
│   │   ├── Hero.tsx          # 首页轮播
│   │   ├── MDXRenderer.tsx   # 文章 MDX 渲染
│   │   ├── UpdatesRenderer.tsx # 更新情报渲染
│   │   ├── ThemeProvider.tsx # 主题
│   │   └── ...
│   └── fonts/                # 本地字体
│
├── content/                  # 内容源
│   ├── posts/                # 博客文章（.mdx）
│   └── updates/              # 站点更新情报（.mdx）
│
├── lib/                      # 业务逻辑
│   ├── posts.ts              # 文章读取（gray-matter + fs）
│   ├── updates.ts            # 更新情报读取
│   ├── wallpapers.ts         # 壁纸数据
│   ├── supabase.ts           # Supabase 客户端
│   ├── holidays.ts           # 节日倒计时
│   └── interests.ts          # 兴趣标签
│
├── scripts/                  # 脚本
│   ├── crawler/              # 新闻爬虫
│   │   ├── index.ts          # 入口
│   │   ├── types/            # 类型定义
│   │   ├── core/             # 核心逻辑（fetcher, scheduler）
│   │   ├── sources/          # 数据源（求是网、RSS）
│   │   ├── parser/           # 解析器（正文、图片）
│   │   ├── pipeline/         # MDX 生成
│   │   ├── utils/            # 工具
│   │   └── cache/            # 去重缓存
│   ├── fetch-meta.ts         # 抓取元数据
│   ├── sync-wallpapers.ts    # 同步壁纸
│   └── remove-duplicates.ts  # 去重
│
├── public/                   # 静态资源
│   ├── images/cover/         # 文章封面
│   └── ...
│
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## ⚙️ 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run fetch-news` | 抓取新闻并生成 MDX |
| `npm run sync-wallpapers` | 同步壁纸 |
| `npm run fetch-meta` | 抓取文章元数据 |
| `npm run seo:submit` | 提交 SEO 链接 |
| `npm run seo:verify` | 验证 SEO |

---

## 📝 内容管理

### 发文章

在 `content/posts/` 下新建 `.mdx` 文件：

```mdx
---
title: "文章标题"
date: "2026-03-13"
summary: "摘要"
tags: ["标签1", "标签2"]
cover: "/images/cover/xxx.jpg"
---

正文内容...
```

### 发更新情报

在 `content/updates/` 下新建 `.mdx` 文件：

```mdx
---
title: "更新标题"
date: "2026-03-13"
emoji: "✨"
category: "milestone"
---

更新内容...
```

### 改兴趣标签

编辑 `lib/interests.ts`。

---

## ⚡ 技术栈

| 技术 | 说明 |
|------|------|
| **Next.js 16** | App Router |
| **React 19** | UI 框架 |
| **Tailwind CSS 4** | 样式 |
| **next-mdx-remote** | MDX 渲染 |
| **gray-matter** | Frontmatter 解析 |
| **Shiki** | 代码高亮 |
| **Supabase** | 评论等后端 |
| **TypeScript** | 类型检查 |

---

## 🚀 部署

### Vercel（推荐）

一键部署，连接 GitHub 即可。

### 其他平台

```bash
npm run build
npm run start
```

---

**⭐ by 是阿鲲鸭**
