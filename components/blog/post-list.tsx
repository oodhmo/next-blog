"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FeaturedPostCard } from "@/components/blog/featured-post-card";
import { PostCard } from "@/components/blog/post-card";
import { buildCategoryColorMap } from "@/lib/category-colors";
import { cn } from "@/lib/utils";
import type { PostWithRelations, PostSortKey } from "@/types";

type PostListProps = {
  posts: PostWithRelations[];
  categories: string[];
  sort: PostSortKey;
};

const SORT_OPTIONS: { key: PostSortKey; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "oldest", label: "오래된순" },
  { key: "views", label: "조회수순" },
];

export function PostList({ posts, categories, sort }: PostListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeCategory, setActiveCategory] = useState("All");
  const colorMap = useMemo(() => buildCategoryColorMap(categories), [categories]);

  function handleSortChange(newSort: PostSortKey) {
    startTransition(() => {
      router.push(`?sort=${newSort}`, { scroll: false });
    });
  }

  const filteredPosts = useMemo(() => {
    if (activeCategory === "All") return posts;
    return posts.filter((post) =>
      post.categories.some((c) => c.category.name === activeCategory)
    );
  }, [posts, activeCategory]);

  const [featured, ...rest] = filteredPosts;

  const featuredBadge =
    sort === "views" ? "Most Viewed" : sort === "oldest" ? "Oldest" : "Latest";

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">아직 포스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 로딩 오버레이 */}
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-background/60 pt-32 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="font-mono text-[12px] text-muted-foreground">정렬 중...</span>
          </div>
        </div>
      )}

      {/* 카테고리 필터 + 정렬 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-y-3 border-b border-border pb-11">
        {/* 좌측: 카테고리 필터 */}
        <div className="flex flex-wrap gap-2">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full border px-[18px] py-2 text-[13px] font-medium transition-all duration-[180ms] hover:scale-[1.04]",
                activeCategory === cat
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 우측: 정렬 버튼 */}
        <div className="flex shrink-0 items-center gap-1">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSortChange(key)}
              aria-pressed={sort === key}
              disabled={isPending}
              className={cn(
                "rounded-full px-3 py-1.5 font-mono text-[12px] font-medium transition-all duration-[180ms]",
                sort === key
                  ? "bg-foreground/8 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                isPending && "opacity-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 포스트 수 + 구분선 */}
      <div className="flex items-center gap-4 py-6">
        <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
          {filteredPosts.length} posts
        </span>
        <div className="h-px flex-1" />
      </div>

      {filteredPosts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">해당 카테고리의 포스트가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-[18px]">
          {/* 피처드 포스트 */}
          {featured && <FeaturedPostCard post={featured} badge={featuredBadge} colorMap={colorMap} />}

          {/* 나머지 포스트 그리드 */}
          {rest.length > 0 && (
            <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))" }}>
              {rest.map((post) => (
                <PostCard key={post.id} post={post} colorMap={colorMap} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
