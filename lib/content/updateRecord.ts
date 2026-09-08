// 强约束：本模块含 fs / path / glob 等 Node.js 专有操作，仅服务端可用。
// 客户端组件请走聚合入口 @/lib/content 拿纯类型，绕过聚合入口直接 import 本模块
// 会在构建期报错（清晰提示），而非运行时模糊的 "Can't resolve 'fs'"。
import 'server-only';

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
// 纯类型从 types.ts 拉取，re-export 保持旧 import 路径 @/lib/content/updateRecord 兼容
import type { UpdateRecord } from './types';
export type { UpdateRecordMeta, UpdateRecord } from './types';

const contentDir = path.join(process.cwd(), "content");
const updateRecordDir = path.join(contentDir, "update-record");

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
