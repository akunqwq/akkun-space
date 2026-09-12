'use client';

import { useState, useRef, useMemo } from 'react';
import { Search, X, FileText } from 'lucide-react';
import type { PostListItem, PostType } from '@/lib/content';
import { POST_TYPES, POST_TYPE_LABELS, TYPE_BADGE_STYLES } from '@/lib/content';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import {
  sanitizeQuery,
  createEnrichedDocument,
  addDocToIndex,
  extractScoredResults,
  type EnrichedDocument,
} from '@/lib/content';
import { useDebouncedValue, SEARCH_DEBOUNCE_MS } from '@/lib/hooks/useDebouncedValue';

// ==================== 类型定义 ====================

interface ArticleSearchBarProps {
  /** 实际展示/可搜索的文章列表（游客态为限流后的切片） */
  articles: PostListItem[];
  /** 类型筛选标签的计数基准：传入全量文章，使统计与登录态无关；缺省回退到 articles */
  totalArticles?: PostListItem[];
}

/** 带索引的数据结构 */
interface IndexedData {
  doc: EnrichedDocument;
  map: Map<string, PostListItem>;
}

// ==================== 索引工厂 ====================

function createArticleIndex(articles: PostListItem[]): IndexedData {
  const doc = createEnrichedDocument({
    storeFields: ['title', 'summary', 'tags'],
  });

  const map = new Map<string, PostListItem>();

  articles.forEach((article) => {
    map.set(article.slug, article);
    addDocToIndex(doc, article.slug, `${article.title} ${article.summary} ${(article.tags || []).join(' ')}`, {
      title: article.title,
      summary: article.summary,
      tags: article.tags || [],
    });
  });

  return { doc, map };
}

const FILTERS = [
  { key: 'all' as const, label: '全部' },
  ...POST_TYPES.map((t) => ({ key: t.key as PostType | 'all', label: t.label })),
];

// ==================== 组件 ====================

export function ArticleSearchBar({ articles, totalArticles }: ArticleSearchBarProps) {
  const [query, setQuery] = useState('');
  // 防抖后的查询值（实际用于搜索的值）
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [activeType, setActiveType] = useState<PostType | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化索引（Document 模式，支持评分）
  // map 仅 createArticleIndex 内部用于 enrich 字段索引，外部不再直接使用
  const { doc } = useMemo(() => createArticleIndex(articles), [articles]);

  // 搜索结果直接派生（useMemo），不再走 state + effect 反模式：
  // query / activeType / articles / doc 任一变化都会重新计算，符合 React 派生状态推荐写法
  const searchResults = useMemo(() => {
    let filtered = articles;

    // 类型过滤
    if (activeType !== 'all') {
      filtered = filtered.filter((a) => a.type === activeType);
    }

    // 搜索过滤
    if (debouncedQuery.trim()) {
      // 搜索词预处理：拦截无意义输入
      const { valid } = sanitizeQuery(debouncedQuery);
      if (!valid) return [];

      // 使用 enrich 搜索 + 评分过滤
      const rawResult = doc.search(debouncedQuery, {
        limit: 50,
        enrich: true,
      });

      const scoredResults = extractScoredResults<string>(rawResult);
      const matchedSlugs = new Set(scoredResults.map(({ id }) => id));
      // 取交集：先类型过滤，再搜索匹配
      filtered = filtered.filter((a) => matchedSlugs.has(a.slug));
    }

    return filtered;
  }, [debouncedQuery, activeType, articles, doc]);

  return (
    <div className="space-y-6">
      {/* 胶囊状搜索栏 - 居中 1/3 宽度 */}
      <div className="relative mx-auto w-full max-w-md">
        <div className="flex items-center gap-3 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] px-5 py-2.5 shadow-[var(--panel-shadow-sm)] transition-shadow focus-within:shadow-[var(--panel-shadow)] focus-within:border-accent/30 focus-within:ring-2 focus-within:ring-accent/10">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="shrink-0 rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 胶囊状类型筛选标签 */}
      <div className="flex flex-wrap justify-center gap-2">
        {FILTERS.map((f) => {
          const isActive = f.key === activeType;
          // 计数基准用全量文章，使类型统计与登录态无关（游客态切片只影响实际展示/搜索）
          const countBase = totalArticles ?? articles;
          const count =
            f.key === 'all'
              ? countBase.length
              : countBase.filter((a) => a.type === f.key).length;

          return (
            <button
              key={f.key}
              onClick={() => setActiveType(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? 'bg-accent text-white border-accent shadow-md shadow-accent/25 scale-105'
                  : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-accent hover:border-accent/30 hover:shadow-md'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs ${isActive ? 'text-white/80' : 'opacity-60'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 搜索状态提示 */}
      {query && (
        <div className="text-center text-sm text-[var(--text-muted)]">
          搜索「<span className="text-accent font-medium">{query}</span>」
          找到 <span className="font-medium text-[var(--text-primary)]">{searchResults.length}</span> 篇文章
        </div>
      )}

      {/* 文章网格 */}
      {searchResults.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {searchResults.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-[var(--text-muted)] mb-4" />
          <p className="[var(--text-secondary)]">未找到相关文章</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">试试其他关键词？</p>
        </div>
      )}
    </div>
  );
}

// 单篇文章卡片
function ArticleCard({ article }: { article: PostListItem }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="
        group block overflow-hidden
        rounded-2xl bg-[var(--card-bg)] backdrop-blur-md
        border border-[var(--border-color)] shadow-[var(--panel-shadow-sm)]
        hover:shadow-[var(--panel-shadow)] hover:-translate-y-1
        transition-all duration-300
      "
    >
      {/* 封面 */}
      <div className="relative h-40 w-full overflow-hidden bg-[var(--border-color)]">
        {article.cover ? (
          <Image
            src={article.cover}
            alt={article.title}
            fill
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[var(--border-color)] to-[var(--text-muted)]" />
        )}
      </div>

      {/* 内容区 */}
      <div className="p-5">
        {/* 类型徽章 */}
        <span
          className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${TYPE_BADGE_STYLES[article.type ?? 'essay']}`}
        >
          {POST_TYPE_LABELS[article.type ?? 'essay']}
        </span>

        <div className="flex items-baseline justify-between gap-3 mt-2 mb-2">
          <h2 className="text-lg font-semibold leading-snug text-[var(--text-primary)] group-hover:text-accent transition-colors line-clamp-2">
            {article.title}
          </h2>
          <span className="text-xs text-accent shrink-0 bg-[var(--border-color)] px-2 py-1 rounded-full">
            {formatDate(article.date)}
          </span>
        </div>

        <p className="text-[var(--text-secondary)] text-sm line-clamp-2 leading-relaxed">
          {article.summary || '-'}
        </p>

        {/* 标签 */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--border-color)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
