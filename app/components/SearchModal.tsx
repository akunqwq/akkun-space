'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, FileText, History, Compass } from 'lucide-react';
import Link from 'next/link';
import {
  sanitizeQuery,
  createEnrichedDocument,
  addDocToIndex,
  extractScoredResults,
  type EnrichedDocument,
  type SearchEntry,
} from '@/lib/content';
import { useDebouncedValue, SEARCH_DEBOUNCE_MS } from '@/lib/hooks/useDebouncedValue';

// ==================== 类型定义 ====================

/** 三类实体聚合后的分组结果 */
type GroupedResults = {
  article: SearchEntry[];
  update: SearchEntry[];
  page: SearchEntry[];
};

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ==================== 类型元数据 ====================

import type { ComponentType } from 'react';

const TYPE_META: Record<SearchEntry['type'], { label: string; icon: ComponentType<{ className?: string }> }> = {
  article: { label: '文章', icon: FileText },
  update: { label: '更新', icon: History },
  page: { label: '页面', icon: Compass },
};

// 按固定顺序遍历分组，确保渲染稳定：文章 → 更新 → 页面
const GROUP_ORDER: Array<keyof GroupedResults> = ['article', 'update', 'page'];

// ==================== 组件 ====================

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const indexRef = useRef<EnrichedDocument | null>(null);
  const dataMapRef = useRef<Map<string, SearchEntry>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // 初始化 FlexSearch 索引（聚合文章/更新/页面，统一索引）
  useEffect(() => {
    if (!isOpen || indexRef.current) return;

    setLoading(true);
    fetch('/api/search-index')
      .then((res) => res.json())
      .then((data: SearchEntry[]) => {
        const doc = createEnrichedDocument({
          storeFields: ['title', 'description', 'href', 'tags', 'category', 'type'],
        });

        const dataMap = new Map<string, SearchEntry>();

        data.forEach((entry) => {
          dataMap.set(entry.id, entry);
          // 搜索文本：标题 + 描述 + 标签（不同类型的可搜索字段差异在这里统一）
          const searchText = `${entry.title} ${entry.description} ${(entry.tags || []).join(' ')}`;
          addDocToIndex(doc, entry.id, searchText, {
            title: entry.title,
            description: entry.description,
            href: entry.href,
            tags: entry.tags,
            category: entry.category,
            type: entry.type,
          });
        });

        indexRef.current = doc;
        dataMapRef.current = dataMap;
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load search index:', err);
        setLoading(false);
      });
  }, [isOpen]);

  // 打开时重置状态 + 自动聚焦
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 核心搜索逻辑（监听防抖后的 query 变化）
  useEffect(() => {
    if (!debouncedQuery.trim() || !indexRef.current) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    // 搜索词预处理：检测乱码 / 无意义重复输入
    const { valid } = sanitizeQuery(debouncedQuery);
    if (!valid) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const rawResult = indexRef.current.search(debouncedQuery, {
      limit: 30,
      enrich: true,
    });

    const scoredResults = extractScoredResults<string>(rawResult);
    const matched = scoredResults
      .map(({ id }) => dataMapRef.current.get(id))
      .filter((e): e is SearchEntry => Boolean(e));

    setResults(matched);
    setSelectedIndex(-1);
  }, [debouncedQuery]);

  // 按类型分组（保持 FlexSearch 给出的相关度顺序）
  const groupedResults = useMemo<GroupedResults>(() => ({
    article: results.filter((e) => e.type === 'article'),
    update: results.filter((e) => e.type === 'update'),
    page: results.filter((e) => e.type === 'page'),
  }), [results]);

  // 键盘导航（按拍平后的扁平索引递增，跨组连续）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      resultsRefs.current[selectedIndex]?.click();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // 保持选中项在可视区域
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRefs.current[selectedIndex]) {
      resultsRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // 渲染时给每条结果分配扁平索引（供 selectedIndex / ref 数组使用）
  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center" role="dialog" aria-modal="true" aria-label="搜索">
      {/* 遮罩：顶部更深的渐变，强化"从上方降临"的层次感 */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/15 dark:from-black/80 dark:via-black/55 dark:to-black/30 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 半屏沉浸面板：从顶部下滑，贴顶 + 底部大圆角，玻璃拟态跟随主题 */}
      <div className="relative h-[min(640px,72vh)] w-full max-w-3xl flex flex-col overflow-hidden rounded-b-3xl border border-t-0 border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--panel-shadow)] backdrop-blur-2xl animate-search-slide">
        {/* 输入区：更舒展的现代搜索栏 */}
        <div className="relative flex items-center gap-4 border-b border-[var(--border-color)] px-6 py-5">
          <Search className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章、更新日志、页面..."
            autoFocus
            className="w-full bg-transparent text-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          {(query || loading) && (
            <button
              onClick={() => { setQuery(''); setResults([]); setSelectedIndex(-1); inputRef.current?.focus(); }}
              className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-inset)] transition-colors"
              aria-label="清除"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden shrink-0 rounded-md border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-2 py-0.5 text-xs text-[var(--text-muted)] sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* 结果区：分组渲染（文章 → 更新 → 页面），跨组键盘导航连续 */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <svg className="h-4 w-4 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                正在构建索引...
              </div>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--text-secondary)]">未找到相关内容</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">试试其他关键词？</p>
            </div>
          )}

          {!loading && !query && (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">输入关键词开始搜索</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">支持搜索：文章、更新日志、页面</p>
              <div className="mt-4 flex justify-center gap-3 text-xs text-[var(--text-muted)]">
                <span><kbd className="rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-1.5 py-0.5 text-[var(--text-secondary)]">↑</kbd> <kbd className="rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-1.5 py-0.5 text-[var(--text-secondary)]">↓</kbd> 导航</span>
                <span><kbd className="rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-1.5 py-0.5 text-[var(--text-secondary)]">Enter</kbd> 选择</span>
                <span><kbd className="rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-1.5 py-0.5 text-[var(--text-secondary)]">Esc</kbd> 关闭</span>
              </div>
            </div>
          )}

          {GROUP_ORDER.map((type) => {
            const group = groupedResults[type];
            if (group.length === 0) return null;
            const meta = TYPE_META[type];
            const Icon = meta.icon;
            return (
              <div key={type} className="mb-1">
                {/* 组标题：图标 + 类型名 + 命中数 */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  <Icon className="h-3 w-3" />
                  <span>{meta.label}</span>
                  <span className="opacity-60">· {group.length}</span>
                </div>
                {group.map((entry) => {
                  const idx = flatIndex++;
                  return (
                    <Link
                      key={entry.id}
                      ref={(el) => { resultsRefs.current[idx] = el; }}
                      href={entry.href}
                      onClick={onClose}
                      className={`group relative block rounded-xl p-3 pl-4 transition-all duration-150 ${
                        idx === selectedIndex
                          ? 'bg-accent/10'
                          : 'hover:bg-[var(--card-bg-inset)]'
                      }`}
                    >
                      {/* 选中态左侧 accent 竖条 */}
                      {idx === selectedIndex && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-1 rounded-full bg-accent" />
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <h4 className={`font-medium leading-snug ${idx === selectedIndex ? 'text-accent' : 'text-[var(--text-primary)] group-hover:text-accent'}`}>
                          {entry.title}
                        </h4>
                        {entry.category && (
                          <span className="shrink-0 rounded-full bg-[var(--card-bg-inset)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                            {entry.category}
                          </span>
                        )}
                      </div>
                      {entry.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{entry.description}</p>
                      )}
                      {entry.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {entry.tags.map((tag) => (
                            <span key={tag} className="rounded bg-[var(--card-bg-inset)] px-1.5 py-0.5 text-[11px] text-[var(--text-muted)]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 底部状态栏：按类型分项统计 + 快捷键 */}
        <div className="flex items-center justify-between border-t border-[var(--border-color)] px-6 py-2.5 text-xs text-[var(--text-muted)]">
          <span>
            {!loading && results.length > 0 && (
              <>
                {groupedResults.article.length > 0 && `${groupedResults.article.length} 篇文章`}
                {groupedResults.article.length > 0 && (groupedResults.update.length > 0 || groupedResults.page.length > 0) && ' · '}
                {groupedResults.update.length > 0 && `${groupedResults.update.length} 条更新`}
                {groupedResults.update.length > 0 && groupedResults.page.length > 0 && ' · '}
                {groupedResults.page.length > 0 && `${groupedResults.page.length} 个页面`}
              </>
            )}
            {!loading && !query && '准备就绪'}
            {!loading && query && results.length === 0 && '无匹配结果'}
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <kbd className="rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-1.5 py-0.5">↵</kbd>
            <span>打开</span>
            <kbd className="rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-1.5 py-0.5">Esc</kbd>
            <span>关闭</span>
          </span>
        </div>
      </div>
    </div>
  );
}