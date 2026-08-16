/**
 * Favicon 未读徽章工具
 *
 * 使用 Canvas 在原始 Favicon 上叠加红点/数字，
 * 通过动态替换 <link rel="icon"> 实现标签页通知效果。
 */

const SIZE = 32; // 与 public/favicon.png 尺寸一致

/** 缓存原始 favicon 的 dataURL，避免重复请求 */
let originalFaviconUrl: string | null = null;

/**
 * 获取原始 Favicon 的 dataURL（仅首次加载时请求）
 */
async function getOriginalFavicon(): Promise<string> {
  if (originalFaviconUrl) return originalFaviconUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      originalFaviconUrl = canvas.toDataURL('image/png');
      resolve(originalFaviconUrl);
    };
    img.onerror = reject;
    img.src = '/favicon.png';
  });
}

/**
 * 绘制带未读数的 Favicon
 * @param count 未读数量，0 或负数表示清除徽章
 */
export async function updateFaviconBadge(count: number): Promise<void> {
  try {
    const original = await getOriginalFavicon();
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = original;
    });

    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    // 绘制原始 Favicon
    ctx.drawImage(img, 0, 0, SIZE, SIZE);

    if (count > 0) {
      // 红色圆形背景
      const badgeRadius = count >= 10 ? 11 : 10;
      const centerX = SIZE - badgeRadius - 1;
      const centerY = badgeRadius + 1;

      ctx.beginPath();
      ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#f33131'; 
      ctx.fill();

      // 数字文字
      ctx.font = `bold ${count >= 10 ? '13' : '14'}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(count > 99 ? '99+' : String(count), centerX, centerY + 1);
    }

    // 替换页面所有 favicon link
    const dataUrl = canvas.toDataURL('image/png');
    const links = document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]');
    if (links.length > 0) {
      links.forEach(link => { link.href = dataUrl; });
    } else {
      // fallback：动态创建
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = dataUrl;
      document.head.appendChild(link);
    }
  } catch {
    // 静默失败，不影响主功能
  }
}
