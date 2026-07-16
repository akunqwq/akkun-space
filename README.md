[English](README.en.md)

# 阿鲲の小窝

> 一个边做边上线、持续进化的个人博客 ✨

ACG 风格个人站点，基于 Next.js 16 构建。基于兴趣记录生活。

在线地址：https://www.akkun.online

---

## 功能

- **首页** (`/`)：Hero + 三栏布局（兴趣/站点统计 · 最近创作文章流 · 关注我），底部含低权重「资讯存档」
- **文章** (`/articles`)：按 `type` 分类（技术 / 折腾 / 随笔 / 资讯），支持筛选与分页
- **文章详情** (`/articles/[slug]`)：MDX 渲染 + Shiki 代码高亮 + 阅读量/点赞（Supabase）
- **关于** (`/about`)：个人介绍、技术栈、正在探索、Roadmap、彩蛋兴趣云
- **更新日志** (`/changelog`)：按版本号（SerVer）记录的里程碑
- **主题**：深色 / 浅色，跟随系统偏好

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 | App Router 框架 |
| React 19 | UI |
| TypeScript | 类型安全 |
| Tailwind CSS 4 | 样式 |
| next-mdx-remote | MDX 渲染 |
| Shiki | 代码高亮 |
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
scripts/              # 构建脚本（generate-posts-index / fetch-meta / seo / ...）
public/               # 静态资源
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run lint` | 代码检查 |
| `npm run generate-index` | 生成文章元数据索引 |
| `npm run fetch-meta` | 抓取文章元数据 |
| `npm run seo:submit` | 提交 SEO 链接 |
| `npm run seo:verify` | 验证 SEO |

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
