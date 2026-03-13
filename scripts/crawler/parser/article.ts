import axios from 'axios';
import * as cheerio from 'cheerio';
import { DEFAULT_UA } from '../utils/request';

/**
 * 提取文章正文内容
 */
export async function fetchArticleContent(link: string): Promise<string> {
  try {
    const resp = await axios.get(link, {
      headers: { 'User-Agent': DEFAULT_UA, Accept: 'text/html' },
      timeout: 15000,
    });

    const $ = cheerio.load(resp.data);

    // 直接锁定最稳定的容器
    const container = $('#detailContent').first();

    if (!container.length) {
      console.log('   ⚠️  未找到 #detailContent 容器');
      return '';
    }

    const paragraphs: string[] = [];

    // 从容器中提取所有段落
    container.find('p').each((_, el) => {
      const text = $(el).text().trim();
      const style = $(el).attr('style') || '';

      // 判断是否为居中标题/导语
      const isCentered = style.includes('text-align:center') || style.includes('text-align: center');

      if (!isMeaningfulParagraph(text)) return;

      if (isCentered) {
        // 居中的短文本作为标题处理
        paragraphs.push(`\n**${text}**\n`);
      } else {
        // 普通段落
        paragraphs.push(text);
      }
    });

    // 如果还是没抓到段落，尝试从整个容器取文本
    if (paragraphs.length === 0) {
      const rawText = container.text().trim();
      if (rawText.length > 50) {
        paragraphs.push(rawText);
      }
    }

    const content = paragraphs.join('\n\n');
    console.log(`   📄 提取到正文 ${content.length} 字符，${paragraphs.length} 段`);
    return content;
  } catch (e) {
    console.log(`   ⚠️ 获取正文失败: ${e instanceof Error ? e.message : 'unknown'}`);
    return '';
  }
}

/**
 * 判断是否为有意义的段落
 */
function isMeaningfulParagraph(text: string): boolean {
  // 过滤空文本或过短文本
  if (!text || text.length < 2) return false;

  // 过滤重复的空格
  const compressed = text.replace(/\s+/g, '');
  if (compressed.length < 2) return false;

  // 过滤元数据
  const metaKeywords = [
    '责任编辑', '来源：', '编辑：', '作者：',
    '版权声明', '转载请注明', '本文来源',
    '【返回】', '【关闭】'
  ];

  if (metaKeywords.some(k => text.includes(k))) return false;

  // 过滤纯数字或纯符号
  if (/^[\d\s\-\+\=]+$/.test(text)) return false;

  // 过滤只含单个字的（可能是图片alt等）
  if (/^.{1}$/.test(text)) return false;

  // 通过所有检查
  return true;
}
