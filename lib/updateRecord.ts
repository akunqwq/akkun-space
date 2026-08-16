import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), "content");
const updateRecordDir = path.join(contentDir, "update-record");

// 更新记录元数据类型
export interface UpdateRecordMeta {
  title: string;
  date: string;
  emoji?: string;
  category?: string;
  version?: string;
  [key: string]: any;
}

// 更新记录内容类型
export interface UpdateRecord extends UpdateRecordMeta {
  slug: string;
  bodyRaw: string;
}

// 获取所有更新记录
export function getUpdateRecords(): UpdateRecord[] {
  try {
    // 确保目录存在
    if (!fs.existsSync(updateRecordDir)) {
      fs.mkdirSync(updateRecordDir, { recursive: true });
      return [];
    }

    // 读取所有 .mdx 文件
    const files = glob.sync('*.mdx', { cwd: updateRecordDir });

    const records: UpdateRecord[] = files.map((file) => {
      const filePath = path.join(updateRecordDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data: meta, content } = matter(raw);

      // 从文件名提取 slug（去掉 .mdx 扩展名）
      const slug = file.replace(/\.mdx$/, '');

      return {
        slug,
        ...meta,
        bodyRaw: content,
      } as UpdateRecord;
    });

    // 按日期降序排序
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return records;
  } catch (error) {
    console.error('Error reading update records:', error);
    return [];
  }
}
