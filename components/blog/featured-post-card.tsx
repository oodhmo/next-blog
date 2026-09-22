import Link from "next/link";
import { Eye } from "lucide-react";
import { formatDateSimple, formatViewCount, estimateReadTime } from "@/lib/utils";
import type { CategoryColor } from "@/lib/category-colors";
import type { PostWithRelations } from "@/types";
import { CategoryBadge } from "@/components/blog/category-badge";

type FeaturedPostCardProps = {
  post: PostWithRelations;
  badge?: string;
  colorMap: Record<string, CategoryColor>;
};

export function FeaturedPostCard({ post, badge = "Latest", colorMap }: FeaturedPostCardProps) {
  // 목록 조회(getPosts)는 응답 크기를 줄이려고 content 대신 readTime을 미리 계산해서 내려준다.
  const readTime = post.readTime ?? estimateReadTime(post.content);
  const firstCategory = post.categories[0]?.category;

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="flex overflow-hidden rounded-[20px] border border-border bg-card will-change-transform transition-[translate,scale,border-color] duration-[220ms] [transition-timing-function:cubic-bezier(.22,1,.36,1)] hover:-translate-y-[5px] hover:scale-[1.01] hover:border-[#C0C0E0] dark:hover:border-[#303050]">

        {/* 왼쪽: 본문 영역 */}
        <div className="flex flex-1 flex-col justify-between p-10 min-w-0">
          <div>
            {/* 카테고리 + LATEST 배지 */}
            <div className="mb-[22px] flex flex-wrap items-center gap-2.5">
              {firstCategory && (
                <CategoryBadge name={firstCategory.name} colorMap={colorMap} />
              )}
              <span className="rounded-full font-mono text-[10px] font-medium uppercase tracking-[1px] px-2.5 py-1 text-primary"
                style={{ background: "oklch(62% 0.22 255 / 0.1)" }}>
                {badge}
              </span>
            </div>

            {/* 제목 */}
            <h2 className="mb-[18px] max-w-[600px] text-[30px] font-bold leading-[1.28] tracking-[-0.9px] text-foreground [text-wrap:pretty]">
              {post.title}
            </h2>

            {/* 요약 */}
            {post.excerpt && (
              <p className="max-w-[560px] text-[15px] leading-[1.85] text-muted-foreground">
                {post.excerpt}
              </p>
            )}
          </div>
        </div>

        {/* 오른쪽: 메타 영역 */}
        <div className="flex w-[156px] shrink-0 flex-col items-end justify-between border-l border-border p-10 text-right">
          <div>
            <p className="font-mono text-[60px] font-bold leading-none tracking-[-4px] text-[oklch(62%_0.22_255_/_0.13)] dark:text-[oklch(62%_0.22_255_/_0.38)]">
              {readTime}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
              min read
            </p>
          </div>
          <div className="space-y-3.5">
            {post.publishedAt && (
              <p className="font-mono text-[11px] tracking-[0.2px] text-muted-foreground">
                {formatDateSimple(post.publishedAt)}
              </p>
            )}
            <p className="flex items-center justify-end gap-[5px] font-mono text-[12px] text-muted-foreground">
              <Eye className="h-[13px] w-[13px]" />
              {formatViewCount(post.viewCount)}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
