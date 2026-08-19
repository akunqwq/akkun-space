import type { Metadata } from "next";
import { getAllPosts } from "../../lib/posts";
import GlassPage from "../components/GlassPage";
import { ArticleSearchBar } from "../components/ArticleSearchBar";

export const metadata: Metadata = {
  title: "专栏",
  description: "专栏 - 阿鲲の小窝",
};

export default async function ArticlesPage() {
  const articles = getAllPosts();

  return (
    <GlassPage maxWidth="max-w-[1400px]">
      <ArticleSearchBar articles={articles} />
    </GlassPage>
  );
}
