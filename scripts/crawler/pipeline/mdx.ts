import fs from 'fs';
import path from 'path';
import { NewsItem } from '../types';

/**
 * 生成MDX文件内容
 */
export function createMDX(news: NewsItem, order: number = 0): string {
  const date = new Date().toISOString().split('T')[0];

  return `---
title: "${news.title}"
date: ${date}
cover: "${news.image || ''}"
order: ${order}
---

${news.image ? `![封面图](${news.image})\n\n` : ''}${news.description}

***

<div className="text-right">

[阅读全文](${news.link})

</div>
`;
}

/**
 * 保存MDX文件
 */
export async function saveMDX(news: NewsItem): Promise<{ imageFilename: string; filepath: string }> {
  // 生成文件名
  const filename = news.title
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);

  const imageFilename = `${filename}-${Date.now()}`;
  const filepath = path.join(process.cwd(), 'content/posts', `${filename}.mdx`);

  // 写入文件
  fs.writeFileSync(filepath, createMDX(news), 'utf-8');
  console.log(`💾 已保存: ${filename}.mdx`);

  return { imageFilename, filepath };
}
