/**
 * @lib/content 聚合入口 —— SHARED 边界层
 *
 * 边界约定（三层守卫，防 client 组件拉进 server 运行时依赖）：
 *
 * 1. 物理边界：本文件只 re-export SHARED 子模块（纯类型 / 常量 / 纯函数，零 Node.js 专有 API）。
 *    含 fs/path/glob 的 server 子模块（posts.ts / updateRecord.ts）顶部带 'server-only' 强约束,
 *    不在此 re-export,调用方须走具体子路径 @/lib/content/posts 或 @/lib/content/updateRecord。
 *
 * 2. 编译期守卫：tsconfig verbatimModuleSyntax=true 强制纯类型 import 必须写 import type,
 *    否则 TS1484 编译失败。防止 client 组件用普通 import 拿类型时被 webpack/swc 跟进 export * 链。
 *
 * 3. lint 守卫：eslint @typescript-eslint/consistent-type-imports=error 做使用分析,
 *    补 tsc 盲区（如 class 符号只当类型用时也要求 import type）,编辑器实时提示。
 *
 * 纯类型集中放 ./types,避免客户端组件为拿类型间接牵连 posts/updateRecord 的 fs 依赖。
 * 新增子模块时：含 Node API → 加 'server-only' + 不在此 re-export；纯类型/纯函数 → 可在此 re-export。
 */
export * from './types';
export * from './postTypes';
export * from './reading-time';
export * from './toc';
export * from './search-utils';
