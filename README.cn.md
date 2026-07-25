[English](README.en.md)

# 阿鲲の小窝

> 一个从零构建的现代化个人博客系统，用于记录技术探索、折腾经历和生活随笔。

ACG 风格个人站，基于 Next.js 16 构建。

在线地址：https://www.akkun.online

---

## 功能

-  Next.js App Router + React Server Components
-  MDX 驱动的文章系统
-  SEO 优化与 Sitemap
-  深色模式
- Supabase 留言系统
- TagWall 标签墙
- 响应式设计
- 静态生成优化
- 媒体中心（自研播放器，切页播放不中断）
- Catkun Pink 品牌色 + Design Tokens

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 | App Router 框架 |
| React 19 | UI |
| TypeScript | 类型安全 |
| Tailwind CSS 4 | 样式 |
| next-mdx-remote | MDX 渲染 |
| Shiki | 代码高亮 |
| lucide-react | 媒体中心图标 |
| Supabase | 阅读量 / 点赞 / 评论后端 |
| gray-matter | Frontmatter 解析 |

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 开发：http://localhost:3000
npm run build    # 生产构建（prebuild 会先生成文章索引）
npm run start    # 启动生产服务
```

## 项目结构

```
app/                 # App Router
  page.tsx            # 首页
  layout.tsx          # 根布局
  globals.css         # 全局样式
  sitemap.ts          # Sitemap
  articles/           # 文章列表 / 详情
  about/              # 关于页
  changelog/          # 更新日志页
  components/         # 组件（Header / Footer / Hero / TagWall / ...）
content/
  posts/              # 博客文章（.mdx）
  updates/            # 更新日志（.mdx，带 version）
lib/                  # 业务逻辑（posts / updates / supabase / interests / techStack / ...）
scripts/              # 构建脚本（generate-posts-index / remove-duplicates）
public/               # 静态资源
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run lint` | 代码检查 |
| `npm run generate-index` | 生成文章元数据索引 |

## 内容管理

### 写文章

在 `content/posts/` 新建 `.mdx`：

```mdx
---
title: "文章标题"
date: "2026-07-15"
summary: "一句话摘要"
type: tinker          # tech | tinker | essay | news
tags: ["折腾", "Windows"]
cover: "/images/cover/xxx.jpg"
---

正文（支持 MDX / 代码高亮）...
```

> 首页信息流只展示 `tech / tinker / essay`；`news` 进入底部「资讯存档」，不抢占首屏。

### 写更新日志

在 `content/updates/` 新建 `.mdx`，**一条 = 一个版本里程碑**（非开发流水账）：

```mdx
---
title: "版本标题"
date: "2026-07-15"
emoji: "🏗️"
category: "milestone"
version: "v0.3.0"
---

- 新增搜索系统
- 评论优化
```

版本粒度：`v0.2.1` 小修（只留 git commit）· `v0.3.0` 功能成长（写日志）· `v1.0.0` 架构大改。

### 改兴趣 / 技术栈

- 兴趣标签：`lib/interests.ts`
- 技术栈：`lib/techStack.ts`

## 部署

- **Vercel（推荐）**：连接 GitHub 仓库，自动构建部署。
- **自托管**：`npm run build && npm run start`。

---

由 阿鲲 用 ❤️ 与 Next.js 搭建。
