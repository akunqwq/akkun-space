import Image from 'next/image';

interface MDXImageProps {
  src?: string;
  alt?: string;
  [key: string]: unknown;
}

/**
 * MDX 图片组件
 * 自动转换为 Next.js Image 组件，支持响应式和优化
 */
export default function MDXImage({ src, alt, ...props }: MDXImageProps) {
  if (!src) return null;

  // 如果是相对路径，转换为绝对路径
  const imageSrc = src.startsWith('/') ? src : `/${src}`;

  return (
    <Image
      src={imageSrc}
      alt={alt || ''}
      width={800}
      height={400}
      className="rounded-lg shadow-md my-6"
      title={alt || ''}
      {...props}
    />
  );
}
