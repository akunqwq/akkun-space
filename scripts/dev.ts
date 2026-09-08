/**
 * dev.ts - 开发服务器 + 文章索引监听
 * ==================================
 *
 * 替代裸 `next dev`，在开发时自动维护 data/posts.json：
 *  - 启动时生成一次索引
 *  - 监听 content/posts 目录下的 .mdx/.md 增删改，防抖 300ms 后重新生成
 *  - Ctrl+C 时转发信号给 next dev 子进程，避免孤儿进程
 *
 * 用法（已接入 package.json）：
 *   npm run dev   → tsx scripts/dev.ts
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { generateIndex } from './generate-posts-index';

const postsDir = path.join(process.cwd(), 'content/posts');

// 1) 启动时生成一次（确保 dev 首屏拿到最新索引）
try {
  generateIndex();
} catch (e) {
  console.error('❌ 启动时生成索引失败:', e);
}

// 2) 监听文章目录变化（Node 22+ 全平台支持 recursive）
let timer: NodeJS.Timeout | null = null;
try {
  fs.watch(postsDir, { recursive: true }, (_event, filename) => {
    if (!filename || !/\.mdx?$/.test(filename)) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      console.log('\n📝 文章目录变化，重新生成索引...');
      try {
        generateIndex();
      } catch (e) {
        console.error('❌ 重新生成索引失败:', e);
      }
      timer = null;
    }, 300);
  });
  console.log('👀 正在监听 content/posts 目录变化（新增/修改 .md/.mdx 后自动刷新索引）');
} catch (e) {
  console.warn('⚠️ 文件监听启动失败（不影响 dev，但新增文章需手动跑 npm run generate-index）:', e);
}

// 3) 启动 next dev，转发 stdio
const child = spawn('next', ['dev'], { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 0));

// 4) 转发终止信号，避免子进程变孤儿
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    child.kill(sig);
    process.exit(0);
  });
}
