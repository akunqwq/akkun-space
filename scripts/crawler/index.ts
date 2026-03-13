import fs from 'fs';
import path from 'path';
import { NewsItem, NewsSource } from './types/index';
import { resolveRealArticleUrl } from './utils/request';
import { fetchArticleContent } from './parser/article';
import { fetchImageFromPage, downloadImage } from './parser/image';
import { createMDX } from './pipeline/mdx';
import { fetchAll } from './core/fetcher';
import { loadSeenLinks, saveSeenLinks, isDuplicate, markAsSeen, getSeenCount } from './cache/dedupe';
import { createScheduler } from './core/scheduler';

// 新闻来源列表
const NEWS_SOURCES: NewsSource[] = [
  { name: '求是网', type: 'scrape', url: 'https://www.qstheory.cn/qsyw/index.htm', category: '要闻' },
];

/**
 * 保存MDX文件（带图片下载）
 */
async function saveMDX(news: NewsItem, order: number): Promise<void> {
  const filename = news.title
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);

  const imageFilename = `${filename}-${Date.now()}`;

  // 获取正文和图片
  if (news.link) {
    const realLink = await resolveRealArticleUrl(news.link);

    console.log(`📄 正在获取正文: ${news.title.substring(0, 20)}...`);
    const content = await fetchArticleContent(realLink);
    news.description = content;

    console.log(`🖼️  正在获取图片: ${news.title.substring(0, 20)}...`);
    const imageUrl = await fetchImageFromPage(realLink);
    if (imageUrl) {
      news.image = await downloadImage(imageUrl, imageFilename, realLink);
    }
  }

  const filepath = path.join(process.cwd(), 'content/posts', `${filename}.mdx`);
  fs.writeFileSync(filepath, createMDX(news, order), 'utf-8');
  console.log(`💾 已保存: ${filename}.mdx (order: ${order})`);
}

/**
 * 爬虫主逻辑
 */
async function runCrawler(): Promise<void> {
  // 确保目录存在
  const coverDir = path.join(process.cwd(), 'public/images/cover');
  if (!fs.existsSync(coverDir)) {
    fs.mkdirSync(coverDir, { recursive: true });
  }

  // 加载历史记录
  loadSeenLinks();

  console.log('='.repeat(50));
  console.log('🌐 开始获取时政资讯');
  console.log('='.repeat(50) + '\n');

  // 获取所有新闻
  const allNews = await fetchAll(NEWS_SOURCES);
  console.log(`\n📊 共获取到 ${allNews.length} 条新闻\n`);

  if (allNews.length === 0) {
    console.log('⚠️  没有获取到新闻');
    return;
  }

  // 过滤重复
  const newNews: NewsItem[] = [];
  const duplicateCount = 0;

  for (const news of allNews) {
    if (isDuplicate(news.link)) {
      console.log(`⏭️  跳过重复: ${news.title.substring(0, 20)}...`);
      continue;
    }
    markAsSeen(news.link);
    newNews.push(news);
  }

  console.log(`📊 新新闻: ${newNews.length} 条，重复: ${allNews.length - newNews.length} 条\n`);

  let newsToProcess = newNews;

  // 如果没有新新闻，从旧新闻中取前5条
  if (newNews.length === 0 && allNews.length > 0) {
    console.log('💡 没有新新闻，抓取5条旧新闻...\n');
    newsToProcess = allNews.slice(0, 5);
    // 将旧新闻也标记为已处理，避免重复抓取
    for (const news of newsToProcess) {
      markAsSeen(news.link);
    }
  }

  if (newsToProcess.length === 0) {
    console.log('⚠️  没有可处理的新闻');
    return;
  }

  // 显示预览
  console.log('─'.repeat(50));
  console.log('📰 新闻预览:');
  console.log('─'.repeat(50) + '\n');

  newsToProcess.forEach((news, index) => {
    console.log(`${index + 1}. [${news.category}] ${news.title}`);
    console.log(`   ${news.source}`);
    console.log('');
  });

  console.log('─'.repeat(50));
  console.log('💡 正在生成 MDX 文件并下载图片...\n');

  const postsDir = path.join(process.cwd(), 'content/posts');
  // 获取当前最大的 order 值
  const files = fs.readdirSync(postsDir);
  const mdxFiles = files.filter(file => /\.mdx?$/.test(file));
  let maxOrder = 0;

  for (const file of mdxFiles) {
    try {
      const filePath = path.join(postsDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const match = raw.match(/^order:\s*(\d+)/m);
      if (match) {
        const order = parseInt(match[1], 10);
        if (order > maxOrder) maxOrder = order;
      }
    } catch (e) {
      // 忽略解析错误
    }
  }

  console.log(`📊 当前最大 order 值: ${maxOrder}\n`);

  // 反转顺序：最新新闻（先抓的）要有最大的order，置顶显示
  const reversedNews = [...newsToProcess].reverse();

  // 生成文件（递增 order）
  for (let i = 0; i < reversedNews.length; i++) {
    const order = maxOrder + i + 1;
    await saveMDX(reversedNews[i], order);
  }

  // 保存历史记录
  saveSeenLinks();

  console.log(`\n✅ 完成！生成了 ${newsToProcess.length} 个 MDX 文件`);
  console.log(`📊 历史记录: ${getSeenCount()} 条`);
  console.log('📂 文件位置: content/posts/');
  console.log('🖼️  图片位置: public/images/cover/');
}

/**
 * 主入口
 */
function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const isDaemon = args.includes('--daemon');
  const intervalArg = args.find(a => a.startsWith('--interval='));
  const interval = intervalArg ? parseInt(intervalArg.split('=')[1], 10) : 60 * 60 * 1000; // 默认 1 小时
  const maxRunsArg = args.find(a => a.startsWith('--max='));
  const maxRuns = maxRunsArg ? parseInt(maxRunsArg.split('=')[1], 10) : 0;

  if (isDaemon) {
    // 定时模式
    createScheduler(runCrawler, {
      intervalMs: interval,
      maxRuns,
    });
  } else {
    // 单次模式
    runCrawler()
      .then(() => {
        console.log('\n🎉 执行完成');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ 出错了:', error.message);
        process.exit(1);
      });
  }
}

main();
