import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'scripts/crawler/cache/seen.json');

// 内存缓存，用于本次运行去重
let memoryCache: Set<string> = new Set();

/**
 * 加载已 seen 的新闻链接
 */
export function loadSeenLinks(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      const links: string[] = JSON.parse(data);
      memoryCache = new Set(links);
      console.log(`📂 已加载 ${memoryCache.size} 条历史记录`);
    }
  } catch (e) {
    console.log('⚠️ 加载历史记录失败，将从零开始');
  }
}

/**
 * 保存已 seen 的新闻链接
 */
export function saveSeenLinks(): void {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify([...memoryCache], null, 2), 'utf-8');
  } catch (e) {
    console.log('⚠️ 保存历史记录失败');
  }
}

/**
 * 检查新闻是否重复
 */
export function isDuplicate(link: string): boolean {
  return memoryCache.has(link);
}

/**
 * 标记新闻为已处理
 */
export function markAsSeen(link: string): void {
  memoryCache.add(link);
}

/**
 * 获取已处理数量
 */
export function getSeenCount(): number {
  return memoryCache.size;
}
