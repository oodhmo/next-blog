import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PostList } from "@/components/blog/post-list";
import { getPosts } from "@/lib/actions/post";
import { getCategories } from "@/lib/actions/category";
import type { PostSortKey } from "@/types";

export const metadata: Metadata = {
  title: "블로그",
  description: "모든 블로그 포스트 목록",
};

type Props = {
  searchParams: Promise<{ sort?: string }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const { sort = "latest" } = await searchParams;
  const validSort: PostSortKey = (["latest", "oldest", "views"] as const).includes(sort as PostSortKey)
    ? (sort as PostSortKey)
    : "latest";

  const [result, categories] = await Promise.all([
    getPosts({ publishedOnly: true, limit: 100, sort: validSort }),
    getCategories(),
  ]);
  const posts = result.success ? result.data : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 page-container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">블로그</h1>
          <p className="mt-2 text-muted-foreground">총 {posts.length}개의 포스트</p>
        </div>
        <PostList posts={posts} categories={categories} sort={validSort} />
      </main>

      <Footer />
    </div>
  );
}
