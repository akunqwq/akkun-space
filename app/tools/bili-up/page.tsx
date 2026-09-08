import type { Metadata } from 'next';

import UpSearchBox from '@/app/components/tools/UpSearchBox';

export const metadata: Metadata = {
  title: 'B 站 UP 主数据查询',
  description:
    '输入 UP 主 mid，实时查询粉丝数、视频播放与三连数据。免费、打开即用。',
};

export default function BiliUpPage() {
  return (
    <section>
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] md:text-2xl">
          B 站 UP 主数据查询
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
          输入 UP 主主页 URL 末尾的数字（mid），实时拉取粉丝、关注、视频数与播放数据。
        </p>
      </div>
      <UpSearchBox />
    </section>
  );
}
