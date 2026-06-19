"use client";

import { useState, useMemo } from "react";
import { FeaturedPostCard } from "@/components/blog/featured-post-card";
import { PostCard } from "@/components/blog/post-card";
import { cn } from "@/lib/utils";
import type { PostWithRelations } from "@/types";

type PostListProps = {
  posts: PostWithRelations[];
  categories: string[];
};

export function PostList({ posts, categories }: PostListProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts = useMemo(() => {
    if (activeCategory === "All") return posts;
    return posts.filter((post) =>
      post.categories.some((c) => c.category.name === activeCategory)
    );
  }, [posts, activeCategory]);

  const [featured, ...rest] = filteredPosts;

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">아직 포스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-11">
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

      {/* 포스트 수 + 구분선 */}
      <div className="flex items-center gap-4 py-6">
        <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
          {filteredPosts.length} posts
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {filteredPosts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">해당 카테고리의 포스트가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-[18px]">
          {/* 피처드 포스트 */}
          {featured && <FeaturedPostCard post={featured} />}

          {/* 나머지 포스트 그리드 */}
          {rest.length > 0 && (
            <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))" }}>
              {rest.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
