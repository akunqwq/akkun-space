import GithubSlugger from "github-slugger";

export interface TocItem {
  id: string;
  text: string;
  level: number; // 仅返回 2 / 3
}

/**
 * 从 MDX 原文提取 h2/h3 作为目录。
 *
 * 关键点：rehype-slug 会对【所有级别的标题】按文档顺序用 github-slugger
 * 生成 id 并自动去重。为了让 TOC 锚点 id 与渲染出的标题 id 完全一致，
 * 这里也按文档顺序遍历 h1-h6 喂给同一个 slugger 实例（保持去重计数同步），
 * 但只把 h2/h3 收进结果。
 *
 * 同时跳过围栏代码块内的 "##"，避免误识别。
 */
export function extractToc(rawMdx: string): TocItem[] {
  const slugger = new GithubSlugger();
  const lines = rawMdx.split("\n");
  const items: TocItem[] = [];
  let inFence = false;

  for (const line of lines) {
    // 围栏代码块开关（``` 或 ~~~）
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;

    const level = m[1].length;
    let text = m[2];

    // 支持 MDX 显式 id 语法：## 标题 {#custom-id}
    const idMatch = /\{#([^}]+)\}\s*$/.exec(text);
    let id: string;
    if (idMatch) {
      id = idMatch[1];
      text = text.replace(/\{#[^}]+\}\s*$/, "").trim();
    } else {
      // 剥离简单行内标记（代码/强调），保留纯文本再 slug
      const plain = text.replace(/[`*_~]/g, "").trim();
      id = slugger.slug(plain);
      text = plain;
    }

    if (level === 2 || level === 3) {
      items.push({ id, text, level });
    } else {
      // 仍要喂给 slugger 以保持去重状态与 rehype-slug 同步
      slugger.slug(text.replace(/[`*_~]/g, "").trim());
    }
  }

  return items;
}
