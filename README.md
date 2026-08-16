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
  update-record/      # update record page
  components/         # components (Header / Footer / Hero / TagWall / ...)
content/
  posts/              # blog posts (.mdx)
  update-record/      # update record entries (.mdx, with version)
lib/                  # business logic & typed data loaders (posts / updateRecord / supabase / ...)
data/
  posts.json          # build-time post index (do not edit by hand)
  site/               # site config data (nav / socials / hero / greetings / holidays / quotes / seo / decor)
  content/            # content data (music / games / interests / tech-stack / post-types / about)
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

### Write an update record entry

Create a new `.mdx` under `content/update-record/` — **one entry = one version milestone** (not a dev diary):

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

### Edit site data (all JSON)

All hardcoded data lives in `data/` — edit data without touching code:

| Data | File |
|------|------|
| Nav / sitemap routes | `data/site/nav.json` |
| Social accounts | `data/site/socials.json` |
| Home channels / per-route hero copy | `data/site/hero.json` |
| Header greetings | `data/site/greetings.json` |
| Holiday countdown | `data/site/holidays.json` |
| Footer quotes | `data/site/quotes.json` |
| SEO keywords | `data/site/seo.json` |
| Floating emojis | `data/site/decor.json` |
| Interest tags | `data/content/interests.json` |
| Tech stack | `data/content/tech-stack.json` |
| Music library | `data/content/music.json` |
| Game library | `data/content/games.json` |
| Post types (label + badge) | `data/content/post-types.json` |
| Exploring / Roadmap | `data/content/about.json` |

## Deployment

- **Vercel (recommended)**: connect the GitHub repo, auto build & deploy.
- **Self-host**: `npm run build && npm run start`.

---

Built by Akun with ❤️ and Next.js.
