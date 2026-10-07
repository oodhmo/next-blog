import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PostList } from "@/components/blog/post-list";
import { getPosts } from "@/lib/actions/post";
import { getCategories } from "@/lib/actions/category";
import { POSTS_PER_PAGE, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/constants";
import { parsePostSort } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ sort?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { sort } = await searchParams;
  const validSort = parsePostSort(sort);

  const [result, categories] = await Promise.all([
    getPosts({ limit: POSTS_PER_PAGE, publishedOnly: true, sort: validSort }),
    getCategories(),
  ]);
  const posts = result.success ? result.data.posts : [];
  const hasMore = result.success ? result.data.hasMore : false;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="page-container pb-[72px] pt-[92px]">
          <p className="mb-7 font-mono text-[11px] font-medium uppercase tracking-[3px] text-primary">
            Fullstack Developer · Seoul, KR
          </p>
          <h1 className="mb-6 max-w-[680px] text-[clamp(38px,5vw,58px)] font-bold leading-[1.1] tracking-[-2.5px] [text-wrap:pretty]">
            {SITE_TAGLINE}
          </h1>
          <p className="max-w-[400px] text-[17px] font-normal leading-[1.75] text-muted-foreground">
            {SITE_DESCRIPTION}
          </p>
        </section>

        {/* 포스트 목록 */}
        <section className="page-container pb-[100px]">
          <PostList key={validSort} initialPosts={posts} initialHasMore={hasMore} categories={categories} sort={validSort} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
