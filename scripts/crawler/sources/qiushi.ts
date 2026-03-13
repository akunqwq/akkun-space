import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { NewsItem } from '../types';
import { DEFAULT_UA, resolveUrl } from '../utils/request';

/**
 * 从求是网 qsyw/index.htm（新闻要闻）抓取新闻
 */
export async function fetchFromQiushi(url: string, sourceName: string, category: string): Promise<NewsItem[]> {
  try {
    console.log(`🔍 正在抓取 ${sourceName} 要闻：${url}`);

    const resp = await axios.get(url, {
      headers: { 'User-Agent': DEFAULT_UA, Accept: 'text/html' },
      timeout: 15000,
    });

    const html = String(resp.data || '');
    
    // 保存调试文件
    try {
      fs.writeFileSync(path.join(process.cwd(), 'debug-qsyw-list.html'), html, 'utf-8');
    } catch {}

    const $ = cheerio.load(html);
    const news: NewsItem[] = [];
    const seenLinks = new Set<string>();

    // qsyw/index.htm 页面结构：.wz-list li a
    $('.wz-list li a').each((_, el) => {
      const title = $(el).text().trim();
      const link = $(el).attr('href');

      if (
        link &&
        title &&
        title.length > 3 &&
        !title.includes('更多') &&
        (link.includes('c.html') || link.includes('c.htm')) &&
        !seenLinks.has(link)
      ) {
        // 处理相对路径
        let fullLink = link;
        if (link.startsWith('../')) {
          fullLink = 'https://www.qstheory.cn/' + link.substring(2);
        } else if (link.startsWith('/')) {
          fullLink = 'https://www.qstheory.cn' + link;
        }
        seenLinks.add(link);
        news.push({ title, link: fullLink, description: '', source: sourceName, category });
      }
    });

    console.log(`✅ ${sourceName}: 抓取到 ${news.length} 条（取前10）`);
    return news.slice(0, 10);
  } catch (error) {
    console.log(`❌ ${sourceName}: 抓取失败 - ${error instanceof Error ? error.message : 'unknown error'}`);
    return [];
  }
}

// 验证文章链接
function isValidArticleLink(link: string | undefined, title: string | undefined): boolean {
  return !!(
    link &&
    title &&
    title.length > 5 &&
    (link.includes('c.html') || link.includes('c.htm'))
  );
}
