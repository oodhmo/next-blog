import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PostList } from "@/components/blog/post-list";
import { getPosts } from "@/lib/actions/post";
import { POSTS_PER_HOME } from "@/lib/constants";

export default async function HomePage() {
  const result = await getPosts({ limit: POSTS_PER_HOME, publishedOnly: true });
  const posts = result.success ? result.data : [];

  const categories = Array.from(
    new Set(
      posts.flatMap((post) => post.categories.map((c) => c.category.name))
    )
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="page-container pb-[72px] pt-[92px]">
          <p className="mb-7 font-mono text-[11px] font-medium uppercase tracking-[3px] text-primary">
            Frontend Developer · Seoul, KR
          </p>
          <h1 className="mb-6 max-w-[680px] text-[clamp(38px,5vw,58px)] font-bold leading-[1.1] tracking-[-2.5px] [text-wrap:pretty]">
            코드와 디자인 사이,
            <br />
            그 경계에서 쓰는 글.
          </h1>
          <p className="max-w-[400px] text-[17px] font-normal leading-[1.75] text-muted-foreground">
            프론트엔드 개발 경험, 삽질 기록, 그리고 가끔 딴 생각들.
          </p>
        </section>

        {/* 포스트 목록 */}
        <section className="page-container pb-[100px]">
          <PostList posts={posts} categories={categories} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
