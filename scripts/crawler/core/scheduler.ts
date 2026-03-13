/**
 * 调度器 - 定时运行爬虫
 */

export interface SchedulerOptions {
  intervalMs: number;  // 间隔时间（毫秒）
  maxRuns?: number;    // 最大运行次数（0 = 无限）
}

/**
 * 创建定时任务
 */
export function createScheduler(fn: () => Promise<void>, options: SchedulerOptions) {
  const { intervalMs, maxRuns = 0 } = options;

  let runCount = 0;
  let isRunning = false;
  let timerId: NodeJS.Timeout | null = null;

  async function tick() {
    if (isRunning) {
      console.log('⏳ 上次任务还在执行中，跳过本次');
      return;
    }

    isRunning = true;
    runCount++;

    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🔄 第 ${runCount} 次执行`);
      console.log('='.repeat(50));

      await fn();

      console.log(`\n✅ 第 ${runCount} 次执行完成`);
    } catch (e) {
      console.error(`❌ 第 ${runCount} 次执行失败:`, e);
    } finally {
      isRunning = false;

      // 检查是否需要继续
      if (maxRuns === 0 || runCount < maxRuns) {
        console.log(`⏰ 下次执行在 ${intervalMs / 1000 / 60} 分钟后...`);
        timerId = setTimeout(tick, intervalMs);
      } else {
        console.log(`🎉 已完成 ${runCount} 次执行，任务结束`);
      }
    }
  }

  // 启动
  console.log(`🚀 调度器已启动，每 ${intervalMs / 1000 / 60} 分钟执行一次`);
  if (maxRuns > 0) {
    console.log(`📊 最多执行 ${maxRuns} 次`);
  }
  tick();

  // 停止函数
  return {
    stop: () => {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
        console.log('🛑 调度器已停止');
      }
    },
    getRunCount: () => runCount,
  };
}

/**
 * 快捷方式：只运行一次（等同于直接调用）
 */
export async function runOnce(fn: () => Promise<void>): Promise<void> {
  await fn();
}
