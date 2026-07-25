 [简体中文](README.md)

# Akun's Blog 

>  A modern personal blog I built from scratch—used to jot down my tech experiments, tinkering adventures, and Random Life Thoughts.

An ACG-style personal website built using Next.js 16. 
Online Address: https://www.akkun.online 
---

## Function 
-  Next.js App Router + React Server Components
- MDX-driven article system
- SEO optimization and Sitemap
- Dark mode
- Supabase comment system
- TagWall tag wall
- Responsive design
- Static generation optimization

## Tech Stack

| Tech | Purpose |
|------|---------|
| Next.js 16 | App Router framework |
| React 19 | UI |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| next-mdx-remote | MDX rendering |
| Shiki | Syntax highlighting |
| Supabase | Views / likes / comments backend |
| gray-matter | Frontmatter parsing |

## Quick Start

```bash
npm install      # install deps
npm run dev      # dev: http://localhost:3000
npm run build    # production build (prebuild generates the post index first)
npm run start    # start production server
```

## Project Structure

```
app/                 # App Router
  page.tsx            # home
  layout.tsx          # root layout
  globals.css         # global styles
  sitemap.ts          # Sitemap
  articles/           # post list / detail
  about/              # about page
  changelog/          # changelog page
  components/         # components (Header / Footer / Hero / TagWall / ...)
content/
  posts/              # blog posts (.mdx)
  updates/            # changelog entries (.mdx, with version)
lib/                  # business logic (posts / updates / supabase / interests / techStack / ...)
scripts/              # build scripts (generate-posts-index / fetch-meta / seo / ...)
public/               # static assets
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run generate-index` | Generate post metadata index |
| `npm run fetch-meta` | Fetch post metadata |
| `npm run seo:submit` | Submit SEO URLs |
| `npm run seo:verify` | Verify SEO |

## Content Management

### Write a post

Create a new `.mdx` under `content/posts/`:

```mdx
---
title: "Post Title"
date: "2026-07-15"
summary: "One-line summary"
type: tinker          # tech | tinker | essay | news
tags: ["tinker", "Windows"]
cover: "/images/cover/xxx.jpg"
---

Body (MDX / syntax highlighting supported)...
```

> The home feed only shows `tech / tinker / essay`; `news` goes to the bottom "News Archive" and stays out of the prime homepage real estate.

### Write a changelog entry

Create a new `.mdx` under `content/updates/` — **one entry = one version milestone** (not a dev diary):

```mdx
---
title: "Version Title"
date: "2026-07-15"
emoji: "🏗️"
category: "milestone"
version: "v0.3.0"
---

- Added search system
- Comment optimizations
```

Version granularity: `v0.2.1` patch (git commit only) · `v0.3.0` feature growth (write a log) · `v1.0.0` architecture overhaul.

### Edit interests / tech stack

- Interest tags: `lib/interests.ts`
- Tech stack: `lib/techStack.ts`

## Deployment

- **Vercel (recommended)**: connect the GitHub repo, auto build & deploy.
- **Self-host**: `npm run build && npm run start`.

---

Built by Akun with ❤️ and Next.js.
