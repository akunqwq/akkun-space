import Link from "next/link";
import BackButton from "./components/BackButton";

export const metadata = {
  title: "404 - 页面走丢啦",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <p
          className="rainbow-text text-8xl sm:text-9xl font-extrabold leading-none select-none mb-4"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mb-3">
          这里暂时还没有被开发哦(´▽｀)~
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <BackButton />
        </div>
      </div>
    </div>
  );
}
