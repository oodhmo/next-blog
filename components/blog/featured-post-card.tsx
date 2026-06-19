import Link from "next/link";
import { Eye } from "lucide-react";
import { formatDateSimple, formatViewCount, estimateReadTime } from "@/lib/utils";
import { getCategoryClass } from "@/lib/category-colors";
import { cn } from "@/lib/utils";
import type { PostWithRelations } from "@/types";

type FeaturedPostCardProps = {
  post: PostWithRelations;
};

export function FeaturedPostCard({ post }: FeaturedPostCardProps) {
  const readTime = estimateReadTime(post.content);
  const firstCategory = post.categories[0]?.category;

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="flex overflow-hidden rounded-[20px] border border-border bg-card will-change-transform transition-[translate,scale,box-shadow,border-color] duration-[220ms] [transition-timing-function:cubic-bezier(.22,1,.36,1)] hover:-translate-y-[5px] hover:scale-[1.01] hover:border-[#C0C0E0] hover:shadow-[0_24px_56px_rgba(20,20,80,0.12)] dark:hover:border-[#303050] dark:hover:shadow-[0_24px_56px_rgba(0,0,0,0.62)]">

        {/* 왼쪽: 본문 영역 */}
        <div className="flex flex-1 flex-col justify-between p-10 min-w-0">
          <div>
            {/* 카테고리 + LATEST 배지 */}
            <div className="mb-[22px] flex flex-wrap items-center gap-2.5">
              {firstCategory && (
                <span
                  className={cn(
                    "rounded-full font-mono text-[10px] font-medium uppercase tracking-[1.5px] px-2.5 py-1",
                    getCategoryClass(firstCategory.name)
                  )}
                  style={{ color: "var(--cat-fg)", background: "var(--cat-bg)" }}
                >
                  {firstCategory.name}
                </span>
              )}
              <span className="rounded-full font-mono text-[10px] font-medium uppercase tracking-[1px] px-2.5 py-1 text-primary"
                style={{ background: "oklch(62% 0.22 255 / 0.1)" }}>
                Latest
              </span>
            </div>

            {/* 제목 */}
            <h2 className="mb-[18px] max-w-[600px] text-[30px] font-bold leading-[1.28] tracking-[-0.9px] text-foreground [text-wrap:pretty] group-hover:text-primary transition-colors">
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
            <p className="font-mono text-[60px] font-bold leading-none tracking-[-4px]"
              style={{ color: "oklch(62% 0.22 255 / 0.13)" }}>
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
