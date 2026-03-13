import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// 默认 User-Agent
export const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// URL 解析工具
export function resolveUrl(pageUrl: string, src: string): string {
  try {
    return new URL(src, pageUrl).href;
  } catch {
    if (src.startsWith('//')) return 'https:' + src;
    return src;
  }
}

// 创建 axios 实例
export function createAxiosInstance() {
  return axios.create({
    timeout: 15000,
    headers: { 'User-Agent': DEFAULT_UA },
  });
}

// 解析真实文章URL（处理RSS跳转页）
export async function resolveRealArticleUrl(url: string): Promise<string> {
  try {
    const resp = await axios.get(url, {
      headers: { 'User-Agent': DEFAULT_UA, Accept: 'text/html' },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: null
    });

    const finalUrl = (resp.request && (resp.request as any).res && (resp.request as any).res.responseUrl) || resp.config?.url || url;
    const html = String(resp.data || '');

    // 写 debug 文件到 debug/ 目录
    try {
      const debugDir = path.join(process.cwd(), 'debug');
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      const name = `debug-article-${(new Date()).toISOString().replace(/[:.]/g, '-')}.html`;
      fs.writeFileSync(path.join(debugDir, name), html, 'utf-8');
    } catch (e) {
      // ignore
    }

    // 1) JS 跳转
    let m = html.match(/window\.location(?:\.href)?\s*=\s*['"](.*?)['"]/i) ||
            html.match(/location\.replace\s*\(\s*['"](.*?)['"]\s*\)/i);
    if (m && m[1]) {
      return resolveUrl(finalUrl, m[1]);
    }

    // 2) meta refresh
    m = html.match(/<meta[^>]*http-equiv=['"]?refresh['"]?[^>]*content=['"]?[^"'>]*url=([^'">]+)['"]?/i) ||
        html.match(/<meta[^>]*content=['"]\s*\d+\s*;\s*url=(.*?)['"]/i);
    if (m && m[1]) {
      return resolveUrl(finalUrl, m[1]);
    }

    // 3) noscript / a[href] 回退
    const $ = cheerio.load(html);
    const nosrcHref = $('noscript a[href]').first().attr('href');
    if (nosrcHref) {
      return resolveUrl(finalUrl, nosrcHref);
    }
    const firstAnchor = $('a[href]').first().attr('href');
    if (firstAnchor && /http/i.test(firstAnchor)) {
      return resolveUrl(finalUrl, firstAnchor);
    }

    // 4) axios 重定向
    if (finalUrl && finalUrl !== url) {
      return finalUrl;
    }

    return url;
  } catch (err) {
    return url;
  }
}
