/**
 * generate-update-record.ts
 *
 * 从一次已合并的 PR 元数据生成 `content/update-record/*.mdx` 草稿条目。
 * 设计目标：消掉「手写更新日志」的摩擦，同时保留人工把关——
 *   本脚本只负责产出一份**草稿文件**，由 GitHub Action 开 PR 供人工润色后合并。
 *
 * 输入（全部来自环境变量，便于本地 dry-run 与 CI 复用）：
 *   PR_NUMBER   合并的 PR 编号
 *   PR_TITLE    PR 标题
 *   PR_BODY     PR 描述（多行）
 *   PR_LABELS   PR 标签 JSON 数组，如 '["feature","fix"]'
 *   MERGED_AT   PR 合并时间 ISO 字符串（用于 date 字段）
 *   COMMITS     合并包含的提交主题 JSON 数组，如 '["feat: x","fix: y"]'
 *
 * 运行：
 *   npx tsx scripts/generate-update-record.ts            # 写盘
 *   npx tsx scripts/generate-update-record.ts --dry-run # 仅打印，不落盘
 *
 * 输出兼容性：完全对齐 lib/updateRecord.ts 的解析约定
 *   - frontmatter：title / date("YYYY-MM-DD") / category / version
 *   - 文件名即 slug：`<date>-<version>.mdx`
 *   - date 字段必须可被 `new Date()` 解析，供降序排序
 */
import fs from "fs";
import path from "path";
import { glob } from "glob";

const updateRecordDir = path.join(process.cwd(), "content", "update-record");

interface Inputs {
  prNumber: string;
  prTitle: string;
  prBody: string;
  prLabels: string[];
  mergedAt: string;
  commits: string[];
}

function parseInputs(): Inputs {
  let prLabels: string[] = [];
  if (process.env.PR_LABELS) {
    try {
      const parsed = JSON.parse(process.env.PR_LABELS);
      if (Array.isArray(parsed)) prLabels = parsed.map(String);
    } catch {
      /* 非 JSON 时忽略，回退空数组 */
    }
  }

  let commits: string[] = [];
  if (process.env.COMMITS) {
    try {
      const parsed = JSON.parse(process.env.COMMITS);
      if (Array.isArray(parsed)) commits = parsed.map(String);
    } catch {
      // 退化：按换行拆分
      commits = process.env.COMMITS.split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return {
    prNumber: process.env.PR_NUMBER || "0",
    prTitle: (process.env.PR_TITLE || "").trim() || "未命名变更",
    prBody: process.env.PR_BODY || "",
    prLabels,
    mergedAt: process.env.MERGED_AT || new Date().toISOString(),
    commits,
  };
}

/** PR 标签 → 更新日志 category（与现有条目风格一致，缺省 update） */
function categoryFromLabels(labels: string[]): string {
  const set = new Set(labels.map((l) => l.toLowerCase()));
  if (set.has("feature") || set.has("feat") || set.has("enhancement")) return "feature";
  if (set.has("fix") || set.has("bug") || set.has("bugfix")) return "fix";
  if (set.has("docs")) return "docs";
  return "update";
}

/** 扫描现有条目，返回最高语义版本号 */
function getLatestVersion(): { major: number; minor: number; patch: number } | null {
  if (!fs.existsSync(updateRecordDir)) return null;
  const files = glob.sync("*.mdx", { cwd: updateRecordDir });
  let best: { major: number; minor: number; patch: number } | null = null;
  for (const f of files) {
    const m = f.match(/v(\d+)\.(\d+)\.(\d+)/);
    if (!m) continue;
    const v = { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
    if (
      !best ||
      v.major > best.major ||
      (v.major === best.major && v.minor > best.minor) ||
      (v.major === best.major && v.minor === best.minor && v.patch > best.patch)
    ) {
      best = v;
    }
  }
  return best;
}

/** 版本号自动 patch bump（具体里程碑语义由人工在 PR 润色时调整） */
function nextVersion(): string {
  const latest = getLatestVersion();
  if (!latest) return "v1.0.0";
  return `v${latest.major}.${latest.minor}.${latest.patch + 1}`;
}

/** ISO → YYYY-MM-DD（UTC，避免时区导致跨日错位） */
function dateFromIso(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function buildMdx(
  input: Inputs,
  category: string,
  version: string,
  date: string,
): string {
  const title = input.prTitle;
  const bodyLines = input.prBody
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 30); // 截断过长的 PR 描述，避免草稿臃肿
  const bodyText = bodyLines.join("\n\n");
  const commitBullets = input.commits.map((c) => `- ${c}`).join("\n");

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `date: "${date}"`,
    `category: "${category}"`,
    `version: "${version}"`,
    "---",
    "",
  ].join("\n");

  const sections: string[] = [
    `### ${title} (#${input.prNumber})`,
    "",
    bodyText || "_（待补充变更说明）_",
  ];

  if (input.commits.length) {
    sections.push("", "**包含的提交**", commitBullets);
  }

  sections.push(
    "",
    "> 本条目由 update-record 自动化草稿生成，请人工润色叙事与版本号后再合并。",
    "",
  );

  return frontmatter + sections.join("\n");
}

function main() {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const input = parseInputs();
  const category = categoryFromLabels(input.prLabels);
  const version = nextVersion();
  const date = dateFromIso(input.mergedAt);
  const mdx = buildMdx(input, category, version, date);
  const filename = `${date}-${version}.mdx`;

  if (dryRun) {
    console.log("--- DRY RUN ---");
    console.log("filename:", filename);
    console.log("category:", category);
    console.log("--------------");
    console.log(mdx);
    return;
  }

  fs.mkdirSync(updateRecordDir, { recursive: true });
  const outPath = path.join(updateRecordDir, filename);
  if (fs.existsSync(outPath)) {
    console.error(`目标文件已存在，跳过写入避免覆盖：${filename}`);
    process.exit(1);
  }
  fs.writeFileSync(outPath, mdx, "utf-8");
  console.log("WROTE", filename);
}

main();
