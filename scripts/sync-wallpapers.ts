import fs from "fs-extra"
import path from "path"

const DATA_PATH = path.resolve("data/wallpapers.json")

type Wallpaper = {
  id: string
  title: string
  url: string
  thumbnail: string
  tags: string[]
  author?: string
  source?: string
  sourceUrl?: string
  uploadedAt?: string
  fileSize?: string
  resolution?: string
}

// ⭐ 新壁纸的文件名列表
const NEW_WALLPAPERS: string[] = [
  "102014823_p0.jpg",
  "136004776_p0.jpg",
  "139539491_p0.png",
  "136017344_p0.png",
  "139598340_p0.png",
  "139431047_p1.jpg",
]

// 根据 ID 生成壁纸数据
function generateFromIds(ids: string[]): Wallpaper[] {
  return ids.map(id => ({
    id,
    title: id.replace(/\.\w+$/, ""),
    url: `https://cdn.someacg.top/graph/origin/${id}`,
    thumbnail: `https://cdn.someacg.top/graph/thumb/${id}`,
    tags: []
  }))
}

// 合并 + 去重（按 URL）
function merge(oldData: Wallpaper[], newData: Wallpaper[]) {
  const map = new Map<string, Wallpaper>()

  oldData.forEach(w => map.set(w.url, w))
  newData.forEach(w => {
    if (!map.has(w.url)) {
      map.set(w.url, w)
    }
  })

  return [...map.values()]
}

// 主流程
async function run() {
  if (NEW_WALLPAPERS.length === 0) {
    console.log("⚠️  NEW_WALLPAPERS 数组为空，请在脚本中添加文件名")
    return
  }

  console.log(`📋 添加 ${NEW_WALLPAPERS.length} 张新壁纸...`)

  const fresh = generateFromIds(NEW_WALLPAPERS)
  fresh.forEach(w => console.log(`  - ${w.id}`))

  const exists = (await fs.pathExists(DATA_PATH))
    ? await fs.readJSON(DATA_PATH)
    : []

  const merged = merge(exists, fresh)

  await fs.outputJSON(DATA_PATH, merged, { spaces: 2 })

  console.log(`✅ 同步完成，总数：${merged.length}`)
}

run()