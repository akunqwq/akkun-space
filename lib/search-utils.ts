/**
 * 搜索工具统一模块
 *
 * 职责：
 * 1. 搜索词预处理（sanitizeQuery）—— 过滤无意义乱码输入
 * 2. FlexSearch Document 索引工厂 —— 支持 enrich（评分/字段级匹配信息）
 * 3. 防抖 Hook —— 减少快速连续输入时的无效搜索
 * 4. 评分阈值过滤 —— 后处理低质量匹配结果
 */

import { useRef, useEffect, useState } from 'react';
import FlexSearch, { Index } from 'flexsearch';

// 重新导出 Document，避免复杂的泛型约束问题
// FlexSearch.Document 的完整签名是 Document<T, P, W>，实际使用中用 any 简化
export type EnrichedDocument = InstanceType<typeof FlexSearch.Document>;

// ==================== 常量 ====================

/** 连续重复字符检测：超过此长度视为可疑 */
export const MAX_REPEATED_CHARS = 3;

/** 搜索结果最低相关性得分阈值（0~1，FlexSearch enrich 返回的 score 归一化后参考值）
 *  低于此值的结果将被丢弃。
 *  注意：FlexSearch 的 score 是内部权重值，不是标准 BM25 分数，
 *  实际阈值需要根据数据量调参。这里设为 0 表示暂时不硬截断，
 *  主要依赖 sanitizeQuery 在输入层拦截。 */
export const MIN_SCORE_THRESHOLD = 0;

/** 防抖延迟（ms） */
export const SEARCH_DEBOUNCE_MS = 200;

// ==================== 1. 搜索词预处理 ====================

interface SanitizeResult {
  /** 清洗后的文本 */
  text: string;
  /** 是否为有效查询（false 时调用方应返回空结果） */
  valid: boolean;
}

/**
 * 清洗用户搜索输入：
 * - 去除首尾空白
 * - 检测连续重复字符（如 11111111、aaa、?????），占比过高则标记无效
 * - 检测纯长数字串（大概率不是有意义的标签搜索）
 */
export function sanitizeQuery(raw: string): SanitizeResult {
  const trimmed = raw.trim();

  if (!trimmed) return { text: '', valid: false };

  // 规则 1：连续重复字符占比 > 60% → 视为垃圾输入
  const repeatedPattern = /(.)\1{3,}/;
  if (repeatedPattern.test(trimmed)) {
    const matches = trimmed.match(/(.)\1+/g);
    if (matches) {
      const totalRepeated = matches.reduce((sum, m) => sum + m.length, 0);
      if (totalRepeated / trimmed.length > 0.6) {
        return { text: trimmed, valid: false };
      }
    }
  }

  // 规则 2：纯数字且长度 >= 5 → 大概率无意义
  if (/^\d{5,}$/.test(trimmed)) {
    return { text: trimmed, valid: false };
  }

  return { text: trimmed, valid: true };
}

// ==================== 2. FlexSearch 索引工厂 ====================

/**
 * 创建基础 FlexSearch Index（用于简单场景）
 * 保持与原有 createIndex / createArticleIndex 兼容
 */
export function createSimpleIndex(): Index {
  return new FlexSearch.Index({
    tokenize: 'forward',
    cache: true,
  });
}

/**
 * 创建带 enrich 支持的 FlexSearch Document 实例
 * 用于需要评分/字段级匹配信息的场景
 *
 * @param options.storeFields - 需要存储在索引中的字段列表（用于 search 结果回填）
 */
export function createEnrichedDocument(options?: {
  storeFields?: string[];
}): EnrichedDocument {
  // flexsearch 0.8 的 TS 类型未声明 enrich 字段（运行时支持），此处用类型兜底
  const docOptions = {
    tokenize: 'forward',
    cache: true,
    enrich: true,
    document: {
      id: 'id',
      index: 'content',
      store: options?.storeFields ?? ['title', 'description', 'tags', 'category'],
    },
  } as unknown as ConstructorParameters<typeof FlexSearch.Document>[0];

  return new FlexSearch.Document(docOptions) as unknown as EnrichedDocument;
}

/**
 * 向 Document 索引添加一条记录
 */
export function addDocToIndex(
  doc: EnrichedDocument,
  id: string,
  content: string,
  fields?: Record<string, unknown>,
): void {
  doc.add({
    id,
    content,
    ...(fields ?? {}),
  });
}

// ==================== 3. 防抖 Hook ====================

/**
 * 防抖值 Hook
 * 返回一个延迟更新的 value，适用于搜索框等高频输入场景
 *
 * @example
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebouncedValue(query, 200);
 * // debouncedQuery 会在 setQuery 停止 200ms 后更新
 */
export function useDebouncedValue<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ==================== 4. 评分过滤 ====================

/** 带评分信息的搜索结果项 */
export interface ScoredResult<T> {
  /** 文档 ID */
  id: T;
  /** FlexSearch 内部相关性得分（越高越相关） */
  score: number;
  /** 匹配到的字段及高亮信息 */
  fields?: Record<string, unknown>[];
}

/**
 * 从 FlexSearch 搜索结果中提取有序的结果 ID 列表。
 *
 * 兼容两种返回结构：
 * - Document 模式（enrich: true）：[{ field, result: [{ id, doc }] }]
 * - Index 模式：string[] 或 [{ id }]
 *
 * ⚠️ 重要说明（FlexSearch 0.8 限制）：
 *    enrich: true 返回的是「存储字段 doc」，并非 BM25 相关性分数。
 *    FlexSearch 0.8 标准 API 不暴露 score，结果本身已按相关性降序排列。
 *    因此本函数返回的 score 是「位置代理分」（越靠前越大），
 *    仅用于兼容 ScoredResult 结构与未来扩展，不可当作绝对相关性阈值使用。
 *
 * @param rawResult - doc.search(query) / index.search(query) 的返回值
 * @param minScore - 最低得分阈值（默认使用模块常量，当前为 0 = 不过滤）
 * @returns 去重后的结果数组，按相关性（原始排序）排列
 */
export function extractScoredResults<T>(
  rawResult: unknown,
  minScore: number = MIN_SCORE_THRESHOLD,
): ScoredResult<T>[] {
  if (!rawResult || typeof rawResult !== 'object') return [];

  const seen = new Set<T>();
  const flatIds: T[] = [];

  // 去重 + 保序（首次出现 = 最高优先级）
  const pushId = (id: T) => {
    if (!seen.has(id)) {
      seen.add(id);
      flatIds.push(id);
    }
  };

  if (Array.isArray(rawResult)) {
    for (const group of rawResult) {
      if (group && typeof group === 'object') {
        // Document 模式：{ field, result: [...] }
        if ('result' in group) {
          const resultArr = (group as { result: unknown[] }).result;
          for (const item of resultArr) {
            if (item && typeof item === 'object' && 'id' in item) {
              pushId((item as { id: T }).id);
            } else if (typeof item === 'string') {
              pushId(item as T);
            }
          }
        }
        // Index 模式（enrich 风格）：{ id, ... }
        else if ('id' in group) {
          pushId((group as { id: T }).id);
        }
      } else if (typeof group === 'string') {
        // Index 模式：纯 ID 字符串
        pushId(group as T);
      }
    }
  }

  // 生成带「位置代理分」的结果（越靠前分越高）
  // 真实 BM25 分数在 FlexSearch 0.8 中不可得，排序依赖引擎内部排名。
  return flatIds
    .map((id, i) => ({
      id,
      score: Number((1 - i / (flatIds.length + 1)).toFixed(4)),
    }))
    .filter((s) => s.score >= minScore);
}
