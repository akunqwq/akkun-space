'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import {
  sanitizeQuery,
  createEnrichedDocument,
  addDocToIndex,
  extractScoredResults,
  useDebouncedValue,
  SEARCH_DEBOUNCE_MS,
  type EnrichedDocument,
} from '@/lib/search-utils';

// ==================== 类型定义 ====================

interface SearchItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ==================== 组件 ====================

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  // 防抖后的查询值（实际用于搜索的值）
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const indexRef = useRef<EnrichedDocument | null>(null);
  const dataMapRef = useRef<Map<string, SearchItem>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // 初始化 FlexSearch Document 索引（enrich 模式，支持评分）
  useEffect(() => {
    if (!isOpen || indexRef.current) return;

    setLoading(true);
    fetch('/api/search-index')
      .then((res) => res.json())
      .then((data: SearchItem[]) => {
        const doc = createEnrichedDocument({
          storeFields: ['title', 'description', 'tags', 'category'],
        });

        const dataMap = new Map<string, SearchItem>();

        data.forEach((item) => {
          dataMap.set(item.id, item);
          addDocToIndex(doc, item.id, `${item.title} ${item.description} ${item.tags.join(' ')}`, {
            title: item.title,
            description: item.description,
            tags: item.tags,
            category: item.category,
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

  // 打开时自动聚焦输入框
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

    // 使用 enrich 搜索 + 评分过滤
    const rawResult = indexRef.current.search(debouncedQuery, {
      limit: 20,
      enrich: true,
    });

    const scoredResults = extractScoredResults<string>(rawResult);
    const matchedItems = scoredResults
      .map(({ id }) => dataMapRef.current.get(id))
      .filter((item): item is SearchItem => Boolean(item));

    setResults(matchedItems);
    setSelectedIndex(-1);
  }, [debouncedQuery]);

  // 输入变化 → 更新原始 query（防抖 hook 会自动延迟触发搜索）
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  // 键盘导航
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

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" role="dialog" aria-modal="true" aria-label="搜索文章">
      {/* 遮罩背景 */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 搜索框 Modal - 玻璃拟态，跟随主题 */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--panel-shadow)] backdrop-blur-xl animate-in zoom-in-95 fade-in duration-200">
        {/* 输入区 */}
        <div className="relative flex items-center gap-3 border-b border-[var(--border-color)] px-4 py-4">
          <Search className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章标题、标签或描述..."
            autoFocus
            className="w-full bg-transparent text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          {(query || loading) && (
            <button
              onClick={() => { setQuery(''); setResults([]); setSelectedIndex(-1); inputRef.current?.focus(); }}
              className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-inset)] transition-colors"
              aria-label="清除"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden shrink-0 rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-2 py-0.5 text-xs text-[var(--text-muted)] sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* 结果列表 */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
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
              <p className="text-sm text-[var(--text-secondary)]">未找到相关文章</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">试试其他关键词？</p>
            </div>
          )}

          {!loading && !query && (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                输入关键词开始搜索
              </p>
              <div className="mt-4 flex justify-center gap-3 text-xs text-[var(--text-muted)]">
                <span><kbd className="rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-1.5 py-0.5 text-[var(--text-secondary)]">↑</kbd> <kbd className="rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-1.5 py-0.5 text-[var(--text-secondary)]">↓</kbd> 导航</span>
                <span><kbd className="rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-1.5 py-0.5 text-[var(--text-secondary)]">Enter</kbd> 选择</span>
                <span><kbd className="rounded border border-[var(--border-color)] bg-[var(--card-bg-inset)] px-1.5 py-0.5 text-[var(--text-secondary)]">Esc</kbd> 关闭</span>
              </div>
            </div>
          )}

          {results.map((item, idx) => (
            <Link
              key={item.id}
              ref={(el) => { resultsRefs.current[idx] = el; }}
              href={`/articles/${item.id}`}
              onClick={onClose}
              className={`block rounded-xl p-3 transition-all duration-150 ${
                idx === selectedIndex
                  ? 'border-accent/30 bg-accent/10'
                  : 'border-transparent hover:border-[var(--border-color)] hover:bg-[var(--card-bg-inset)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className={`font-medium leading-snug ${idx === selectedIndex ? 'text-accent' : 'text-[var(--text-primary)]'}`}>
                  {item.title}
                </h4>
                {item.category && (
                  <span className="shrink-0 rounded-full bg-[var(--card-bg-inset)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                    {item.category}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{item.description}</p>
              )}
              {item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded bg-[var(--card-bg-inset)] px-1.5 py-0.5 text-[11px] text-[var(--text-muted)]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* 底部提示 */}
        {!loading && results.length > 0 && (
          <div className="border-t border-[var(--border-color)] px-4 py-2 text-right text-xs text-[var(--text-muted)]">
            找到 {results.length} 篇文章
          </div>
        )}
      </div>
    </div>
  );
}
