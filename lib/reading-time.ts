/**
 * 阅读时间估算（纯函数，无副作用，构建阶段与运行时回退共用）。
 *
 * 思路：
 * 1. 先剥离 MDX / Markdown 噪声——代码块、图片、链接标记、格式符号，
 *    否则标题符号 / 图片路径 / 代码 / 标签都会被 length 算进去，结果偏大。
 * 2. 去掉空白后按字符数估算。
 * 3. 普通浏览速度取 500 字/分钟（开发记录 / 游戏分析 / 折腾笔记等非论文类），
 *    并用 Math.max(1, ...) 保证至少 1 分钟；超过 60 分钟封顶为 60（长公文类
 *    如实显示会到上百分钟，失真且无意义，UI 层会渲染成「60+」）。
 */
export function calcReadingTime(content: string): number {
  const plain = content
    .replace(/```[\s\S]*?```/g, '') // 围栏代码块（整段移除）
    .replace(/~~~[\s\S]*?~~~/g, '') // 波浪围栏代码块
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 图片（整段移除，alt 通常无阅读价值）
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接：保留可见文字
    .replace(/[#>*_~`]/g, ''); // 残留 Markdown 符号（含行内代码反引号）

  const chars = plain.replace(/\s/g, '').length; // 去空白后统计字符数
  return Math.min(60, Math.max(1, Math.ceil(chars / 500)));
}
