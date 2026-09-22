import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PostList } from "@/components/blog/post-list";
import { getPosts } from "@/lib/actions/post";
import { getCategories } from "@/lib/actions/category";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { parsePostSort } from "@/lib/utils";

export const metadata: Metadata = {
  title: "블로그",
  description: "모든 블로그 포스트 목록",
};

type Props = {
  searchParams: Promise<{ sort?: string }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const { sort } = await searchParams;
  const validSort = parsePostSort(sort);

  const [result, categories] = await Promise.all([
    getPosts({ publishedOnly: true, limit: POSTS_PER_PAGE, sort: validSort }),
    getCategories(),
  ]);
  const posts = result.success ? result.data.posts : [];
  const hasMore = result.success ? result.data.hasMore : false;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 page-container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">블로그</h1>
        </div>
        <PostList key={validSort} initialPosts={posts} initialHasMore={hasMore} categories={categories} sort={validSort} />
      </main>

      <Footer />
    </div>
  );
}
