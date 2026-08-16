// 阅读时间计算
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
