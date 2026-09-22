import Link from "next/link";
import { Eye } from "lucide-react";
import { formatDateSimple, formatViewCount, estimateReadTime } from "@/lib/utils";
import type { CategoryColor } from "@/lib/category-colors";
import type { PostWithRelations } from "@/types";
import { CategoryBadge } from "@/components/blog/category-badge";

type PostCardProps = {
  post: PostWithRelations;
  colorMap: Record<string, CategoryColor>;
};

export function PostCard({ post, colorMap }: PostCardProps) {
  // 목록 조회(getPosts)는 응답 크기를 줄이려고 content 대신 readTime을 미리 계산해서 내려준다.
  const readTime = post.readTime ?? estimateReadTime(post.content);
  const firstCategory = post.categories[0]?.category;

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="flex h-full flex-col rounded-[18px] border border-border bg-card p-[26px] pb-[22px] will-change-transform transition-[translate,scale,border-color] duration-[220ms] [transition-timing-function:cubic-bezier(.22,1,.36,1)] hover:-translate-y-[5px] hover:scale-[1.018] hover:border-[#C0C0E0] dark:hover:border-[#303050]">

        {/* 상단: 카테고리 + 읽기 시간 */}
        <div className="mb-[17px] flex items-center justify-between">
          {firstCategory ? (
            <CategoryBadge name={firstCategory.name} colorMap={colorMap} />
          ) : (
            <span />
          )}
          <span className="font-mono text-[11px] text-muted-foreground">
            {readTime}m
          </span>
        </div>

        {/* 제목 */}
        <h2 className="mb-[11px] text-[17.5px] font-semibold leading-[1.45] tracking-[-0.4px] text-foreground [text-wrap:pretty] line-clamp-2">
          {post.title}
        </h2>

        {/* 요약 */}
        {post.excerpt && (
          <p className="flex-1 text-[13.5px] leading-[1.8] text-muted-foreground line-clamp-3 [text-wrap:pretty] mb-[22px]">
            {post.excerpt}
          </p>
        )}

        {/* 하단: 날짜 + 조회수 */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-[18px] font-mono text-[11px] text-muted-foreground">
          {post.publishedAt ? (
            <time dateTime={post.publishedAt.toISOString()} className="tracking-[0.2px]">
              {formatDateSimple(post.publishedAt)}
            </time>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-[5px]">
            <Eye className="h-3 w-3" />
            {formatViewCount(post.viewCount)}
          </span>
        </div>
      </article>
    </Link>
  );
}
