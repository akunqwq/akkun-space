import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

// 读取所有MDX文件
const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdx'));

// 存储标题和对应的文件
const titleMap = new Map<string, string[]>();

console.log(`🔍 检查 ${files.length} 个MDX文件...\n`);

// 收集所有文件及其标题
for (const file of files) {
  const filePath = path.join(POSTS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // 提取标题（第一行通常是 # 标题）
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    
    if (!titleMap.has(title)) {
      titleMap.set(title, []);
    }
    titleMap.get(title)!.push(file);
  }
}

// 找出重复的标题
let duplicatesFound = 0;
const filesToDelete: string[] = [];

for (const [title, fileNames] of titleMap) {
  if (fileNames.length > 1) {
    duplicatesFound++;
    console.log(`⚠️  发现重复标题: "${title}"`);
    console.log(`   文件: ${fileNames.join(', ')}`);
    
    // 保留第一个，删除其他
    for (let i = 1; i < fileNames.length; i++) {
      filesToDelete.push(fileNames[i]);
    }
    console.log(`   将删除: ${fileNames.slice(1).join(', ')}\n`);
  }
}

if (filesToDelete.length === 0) {
  console.log('✅ 没有发现重复的新闻！');
} else {
  console.log(`\n🗑️  准备删除 ${filesToDelete.length} 个重复文件...`);
  
  for (const file of filesToDelete) {
    const filePath = path.join(POSTS_DIR, file);
    fs.unlinkSync(filePath);
    console.log(`   ✅ 已删除: ${file}`);
  }
  
  console.log(`\n🎉 完成！删除了 ${filesToDelete.length} 个重复文件。`);
}
