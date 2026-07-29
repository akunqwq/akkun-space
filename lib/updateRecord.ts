import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), "content");
const updatesDir = path.join(contentDir, "updates");

// 动态元数据类型
export interface UpdateMeta {
  title: string;
  date: string;
  emoji?: string;
  category?: string;
  version?: string;
  [key: string]: any;
}

// 动态内容类型
export interface Update extends UpdateMeta {
  slug: string;
  bodyRaw: string;
}

// 获取所有动态
export function getUpdates(): Update[] {
  try {
    // 确保目录存在
    if (!fs.existsSync(updatesDir)) {
      fs.mkdirSync(updatesDir, { recursive: true });
      return [];
    }

    // 读取所有 .mdx 文件
    const files = glob.sync('*.mdx', { cwd: updatesDir });
    
    const updates: Update[] = files.map((file) => {
      const filePath = path.join(updatesDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data: meta, content } = matter(raw);
      
      // 从文件名提取 slug（去掉 .mdx 扩展名）
      const slug = file.replace(/\.mdx$/, '');
      
      return {
        slug,
        ...meta,
        bodyRaw: content,
      } as Update;
    });

    // 按日期降序排序
    updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return updates;
  } catch (error) {
    console.error('Error reading updates:', error);
    return [];
  }
}