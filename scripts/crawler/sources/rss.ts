import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';
import { NewsItem, NewsSource } from '../types';
import { DEFAULT_UA, resolveUrl } from '../utils/request';

/**
 * 从 RSS 源抓取新闻
 */
export async function fetchFromRSS(source: NewsSource): Promise<NewsItem[]> {
  try {
    console.log(`📡 正在获取 ${source.name}...`);

    const resp = await axios.get(source.url, {
      headers: { 'User-Agent': DEFAULT_UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: null
    });

    const xml = String(resp.data || '');
    const parser = new Parser();
    let feed;

    try {
      feed = await parser.parseString(xml);
    } catch (e) {
      console.log('   ⚠️ rss-parser 失败，准备用 cheerio 回退解析');
    }

    const news: NewsItem[] = [];

    // rss-parser 解析
    if (feed && Array.isArray(feed.items) && feed.items.length > 0) {
      console.log(`   rss-parser: 抽取到 ${feed.items.length} 条`);
      for (const item of feed.items.slice(0, 3)) {
        const title = (item.title || '').trim();
        let link = (item.link || (item.enclosure && (item.enclosure as any).url) || '').trim();
        if (!link && (item as any).guid) link = String((item as any).guid).trim();

        if (link && !/^https?:\/\//i.test(link)) link = resolveUrl(source.url, link);

        const description = ((item.contentSnippet || item.content || item.summary) || '').replace(/<[^>]*>/g, '').substring(0, 300);

        if (title && link) {
          news.push({ title, link, description: description || '暂无简介', source: source.name, category: source.category });
        }
      }
    }

    // cheerio 回退解析
    if (news.length === 0) {
      console.log('   ↪ 回退到 cheerio 解析');
      const $ = cheerio.load(xml, { xmlMode: true });

      const nodes = $('item, entry').toArray();
      if (nodes.length > 0) {
        for (const node of nodes.slice(0, 3)) {
          const $n = $(node);
          const title = $n.find('title').text().trim();
          let link = $n.find('link').attr('href') || $n.find('link').text().trim() || '';
          if (!link) link = $n.find('guid').text().trim() || $n.find('id').text().trim() || '';
          if (link && !/^https?:\/\//i.test(link)) link = resolveUrl(source.url, link);
          const description = $n.find('description').text().trim() || $n.find('summary').text().trim();

          if (title && link) {
            news.push({ title, link, description: (description || '').replace(/<[^>]*>/g, '').substring(0,300) || '暂无简介', source: source.name, category: source.category });
          }
        }
      } else {
        // 正则回退
        const links: string[] = [];
        const re = /(https?:\/\/[^\s"'<>]+?\/\d{4}(?:\/[0-9a-zA-Z_/-]*)?c\.html)/gi;
        let mm;
        while ((mm = re.exec(xml))) links.push(mm[0]);
        if (links.length === 0) {
          const re2 = /(https?:\/\/[^\s"'<>]+)/gi;
          while ((mm = re2.exec(xml))) links.push(mm[0]);
        }
        links.filter(Boolean).slice(0,3).forEach(l => {
          news.push({ title: '（来自 RSS）', link: l, description: '（自动填充）', source: source.name, category: source.category });
        });
      }
    }

    console.log(`✅ ${source.name}: 最终解析到 ${news.length} 条`);
    return news;
  } catch (error) {
    console.log(`❌ ${source.name}: 获取失败 - ${error instanceof Error ? error.message : 'unknown error'}`);
    return [];
  }
}
