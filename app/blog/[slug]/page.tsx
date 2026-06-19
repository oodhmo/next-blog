import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PostDetail } from "@/components/blog/post-detail";
import { getPostBySlug } from "@/lib/actions/post";

// Next.js 15: params는 Promise
type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPostBySlug(slug);

  if (!result.success) {
    return { title: "포스트를 찾을 수 없음" };
  }

  const post = result.data;
  return {
    title: post.title,
    description: post.excerpt ?? post.content.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const result = await getPostBySlug(slug);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 page-container py-12">
        <PostDetail post={result.data} />
      </main>
      <Footer />
    </div>
  );
}
