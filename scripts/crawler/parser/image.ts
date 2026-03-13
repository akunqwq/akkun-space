import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { DEFAULT_UA, resolveUrl } from '../utils/request';

/**
 * 从页面尝试提取封面图
 */
export async function fetchImageFromPage(link: string): Promise<string | undefined> {
  try {
    console.log(`   🔍 访问页面: ${link}`);
    const resp = await axios.get(link, {
      timeout: 10000,
      headers: { 'User-Agent': DEFAULT_UA, Accept: 'text/html,application/xhtml+xml' },
    });
    const html = String(resp.data || '');
    const $ = cheerio.load(html);

    const candidates = new Set<string>();

    // 1) 常见 meta
    const og = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    if (og) candidates.add(resolveUrl(link, og));

    // 2) 常见选择器
    const selectors = ['.article-content img', '.article img', '.content img', '.news-content img', 'img'];
    for (const sel of selectors) {
      $(sel).each((_, el) => {
        const $el = $(el);
        const src = $el.attr('data-src') || $el.attr('data-original') || $el.attr('data-lazy') || $el.attr('data-echo') || $el.attr('src') || '';
        if (src) candidates.add(resolveUrl(link, src));

        const srcset = $el.attr('srcset');
        if (srcset) {
          const parts = srcset.split(',').map(s => s.trim().split(' ')[0]).filter(Boolean);
          if (parts.length) candidates.add(resolveUrl(link, parts[parts.length - 1]));
        }
      });
    }

    // 3) 内联 style background-image
    $('[style]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const m = style.match(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/i);
      if (m && m[2]) candidates.add(resolveUrl(link, m[2]));
    });

    // 4) 全文正则回退
    const regex = /(https?:)?\/\/[^\s"'<>]+?\.(?:jpe?g|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi;
    let match;
    while ((match = regex.exec(html))) {
      let url = match[0];
      if (url.startsWith('//')) url = 'https:' + url;
      candidates.add(resolveUrl(link, url));
    }

    // 过滤并排除 logo / avatar / icon 等小图，以及二维码和社交媒体图片
    const filtered = Array.from(candidates)
      .map(u => u.trim())
      .filter(u => {
        // 排除非图片文件
        if (!u.match(/\.(jpe?g|jpeg|png|webp)(\?.*)?$/i)) return false;
        
        // 排除明显的小图/装饰图
        if (/logo|icon|avatar|qr|spacer|blank|sprite|zxcode/i.test(u)) return false;
        
        // 排除二维码（通过文件名特征）
        const filename = u.toLowerCase();
        if (/qrcode|qr_code|zxcode|wxcode|erweima|erweima/i.test(filename)) return false;
        
        // 排除社交媒体相关图片
        if (/weibo|weixin|qqzone|qzone|wxcon|wx_emoji|share|wx/i.test(filename)) return false;
        
        // 排除版本/资源号相关图片
        if (/\/(v\d+_|n\d+_|image\/icon\/)/i.test(u)) return false;
        
        // 排除尺寸明显小的图片（通过文件名）
        if (/icon|thumb|mini|small/i.test(filename)) return false;
        
        // 排除可能是功能性图片的路径
        if (/\/(share|icon|logo|footer|header|nav|btn|button)\//i.test(u)) return false;
        
        return true;
      });

    if (filtered.length === 0) {
      console.log('   ⚠️  未找到合适的图片候选');
      return undefined;
    }

    // 优先选包含文章日期的图片
    const prefer = filtered.find(u => /2026|2025|\/2026|\/2025|\/\d{8}\//.test(u)) || filtered[0];
    console.log(`   ✅ 找到图片: ${prefer}`);
    return prefer;
  } catch (error) {
    console.log(`   ❌ 获取页面失败: ${error instanceof Error ? error.message : 'unknown error'}`);
    return undefined;
  }
}

/**
 * 下载图片到本地
 */
export async function downloadImage(url: string, filename: string, referer?: string): Promise<string> {
  try {
    const resp = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': DEFAULT_UA,
        Referer: referer || url,
        Accept: 'image/*,*/*;q=0.8',
      },
    });

    // 通过 content-type 决定扩展名
    const ct = resp.headers['content-type'] || '';
    let ext = 'jpg';
    if (ct.includes('png')) ext = 'png';
    else if (ct.includes('webp')) ext = 'webp';
    else if (ct.includes('jpeg')) ext = 'jpg';

    // 如果 url 本身带扩展，优先使用
    const urlExtMatch = url.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i);
    if (urlExtMatch) ext = urlExtMatch[1].toLowerCase();

    const safeFilename = `${filename}.${ext}`;
    const imagePath = path.join(process.cwd(), 'public/images/cover', safeFilename);

    fs.writeFileSync(imagePath, Buffer.from(resp.data));
    return `/images/cover/${safeFilename}`;
  } catch (err) {
    console.log(`⚠️  下载图片失败: ${url}  (${err instanceof Error ? err.message : 'unknown'})`);
    return '';
  }
}
