import { NewsItem, NewsSource } from '../types';
import { fetchFromQiushi } from '../sources/qiushi';
import { fetchFromRSS } from '../sources/rss';

/**
 * 统一的 fetcher - 执行所有 source
 */
export async function fetchAll(sources: NewsSource[]): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  for (const source of sources) {
    let news: NewsItem[] = [];

    if (source.type === 'scrape') {
      // 栏目页抓取
      news = await fetchFromQiushi(source.url, source.name, source.category);
    } else {
      // RSS 抓取
      news = await fetchFromRSS(source);
    }

    allNews.push(...news);
  }

  return allNews;
}
