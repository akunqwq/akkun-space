import GithubSlugger from "github-slugger";

export interface TocItem {
  id: string;
  text: string;
  level: number; // 仅返回 2 / 3
}

/*从 MDX 原文提取 h2/h3 作为目录。*/
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
