[English](README.md)

# 阿鲲の小窝

> 一个长期经营的个人数字空间——记录技术探索与折腾经历，也放音乐、游戏与各种花活。

ACG 风格个人站，基于 Next.js 16 构建。这里不只是一个博客：文章是其中一块拼图，更多是一个**有性格的个人空间**。

在线地址：https://www.akkun.online

---

## 这是什么

阿鲲の小窝是一个**长期维护的个人空间（personal space）**，而非一次性的博客作品。它由几块相互独立又彼此呼应的模块组成：

- **文章 / 专栏**：MDX 驱动的内容系统，记录技术随笔与折腾日志（只是空间里的一块，不是全部）。
- **音乐库**：自带自研播放器，支持私有桶签名播放、悬浮窗与刷新持久化。
- **TagWall**：标签墙，用 Poisson 布局把兴趣与标签可视化漂浮。
- **留言板 / 互动**：基于 Supabase 的留言、点赞、阅读量。
- **游戏库 / 资讯存档**：其它内容板块。

> **定位说明**：项目从「简历作品」演进为「长期产品」，工程标准以**可维护性**为第一优先级，而非演示效果。

## 功能特性

- Next.js App Router + React Server Components
- **MDX 内容系统**（文章 / 更新记录，仅作为空间内的内容板块之一）
- 媒体中心（自研播放器，切页播放不中断）
- TagWall 标签墙（Poisson 漂浮布局）
- Supabase 留言 / 点赞 / 阅读量
- 深色模式 + Catkun Pink 品牌色 + Design Tokens
- SEO 优化与 Sitemap
- 响应式设计
- 静态生成（SSG）优化

## 架构亮点

这是项目的差异化卖点，也是长期可维护性的地基：

- **依赖分层策略**：核心内容（SSG）缺依赖时 fail-fast；可选增强（点赞 / 留言等）缺依赖时 graceful degradation。判断标准：这个依赖挂了，页面还能不能正常生成？
- **Supabase 双 Client 隔离**：客户端 client（`lib/supabase.ts`，受 RLS 约束，安全下发浏览器）与服务端 client（`lib/supabase-storage.ts`，绕 RLS，仅服务端）按环境隔离，不混用。
- **类型驱动设计**：拒绝 `null as unknown as T` 之类类型欺骗；用 `T | null` 强制调用方做 null guard。
- **内容工程化**：MDX 管线 + prebuild 脚本自动生成 `data/posts.json` 索引，不手写静态页。

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 | App Router 框架 |
| React 19 | UI |
| TypeScript | 类型安全 |
| Tailwind CSS 4 | 样式 |
| next-mdx-remote | MDX 渲染 |
| Shiki | 代码高亮 |
| lucide-react | 图标 |
| Supabase | 互动数据后端（点赞 / 阅读量 / 留言） |
| gray-matter | Frontmatter 解析 |

## 质量门禁（CI）

仓库配置了 GitHub Actions 基础 CI（`.github/workflows/ci.yml`），每次 push / PR 自动运行三道检查：

1. **类型检查** `tsc --noEmit` —— 强制类型纪律与 null guard。
2. **Lint** `eslint .` —— 未用导入 / 反模式。
3. **生产构建** `next build` —— SSG / 构建期报错。

构建步仅注入 `NEXT_PUBLIC_*` 占位变量，不碰任何密钥；真实 Supabase 集成由 Vercel 运行时用真实环境变量验证。

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
  page.tsx            # 首页（多模块玻璃面板）
  layout.tsx          # 根布局
  globals.css         # 全局样式
  sitemap.ts          # Sitemap
  articles/           # 文章列表 / 详情（内容板块之一）
  music/              # 音乐库
  about/              # 关于页
  update-record/      # 更新记录页
  components/         # 组件（Header / Footer / Hero / TagWall / Music / ...）
content/
  posts/              # 文章（.mdx）
  update-record/      # 更新记录（.mdx，带 version）
lib/                  # 业务逻辑与数据读取层（posts / supabase / supabase-storage / ...）
data/
  posts.json          # 构建期生成的文章索引（勿手改）
  site/               # 站点配置数据（nav / socials / hero / greetings / ...）
  content/            # 内容数据（music / games / interests / tech-stack / ...）
scripts/              # 构建脚本（generate-posts-index / remove-duplicates）
public/               # 静态资源
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run lint` | 代码检查（ESLint 9） |
| `npm run generate-index` | 生成文章元数据索引 |

## 内容管理

### 写文章（空间内的内容板块之一）

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

### 写更新记录

在 `content/update-record/` 新建 `.mdx`，**一条 = 一个版本里程碑**（非开发流水账）：

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

### 改站点数据（全部 JSON 化）

所有硬编码数据已抽离到 `data/`，改数据不用碰代码：

| 数据 | 文件 |
|------|------|
| 导航 / sitemap 路由 | `data/site/nav.json` |
| 社交账号（B站/GitHub/QQ） | `data/site/socials.json` |
| 首页频道 / 各页 Hero 文案 | `data/site/hero.json` |
| Header 问候语 | `data/site/greetings.json` |
| 节日倒计时 | `data/site/holidays.json` |
| 页脚名言 | `data/site/quotes.json` |
| SEO 关键词 | `data/site/seo.json` |
| 漂浮 emoji | `data/site/decor.json` |
| 兴趣标签 | `data/content/interests.json` |
| 技术栈 | `data/content/tech-stack.json` |
| 音乐库 | `data/content/music.json` |
| 游戏库 | `data/content/games.json` |
| 文章类型（标签+徽章色） | `data/content/post-types.json` |
| 正在探索 / Roadmap | `data/content/about.json` |

## Roadmap

- [ ] WallpaperWall（壁纸展示）
- [ ] Live2D 看板娘
- [ ] Header 游戏栏（2048 / 贪吃蛇等 H5 入口）
- [ ] 运行时监控 / 告警（主动发现线上故障）

## 部署

- **Vercel（推荐）**：连接 GitHub 仓库，自动构建部署。需在 Vercel 配置 4 个环境变量（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SITE_URL`），改完必须 Redeploy。
- **自托管**：`npm run build && npm run start`。

---

由 阿鲲 用 ❤️ 与 Next.js 搭建。
