"use client";

import { useState, useTransition, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { FeaturedPostCard } from "@/components/blog/featured-post-card";
import { PostCard } from "@/components/blog/post-card";
import { buildCategoryColorMap } from "@/lib/category-colors";
import { cn } from "@/lib/utils";
import { getPosts } from "@/lib/actions/post";
import { POSTS_PER_PAGE } from "@/lib/constants";
import type { PostWithRelations, PostSortKey } from "@/types";

type Category = { name: string; slug: string };

type PostListProps = {
  initialPosts: PostWithRelations[];
  initialHasMore: boolean;
  categories: Category[];
  sort: PostSortKey;
};

const SORT_OPTIONS: { key: PostSortKey; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "oldest", label: "오래된순" },
  { key: "views", label: "조회수순" },
];

export function PostList({ initialPosts, initialHasMore, categories, sort }: PostListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 포스트 목록 상태
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // 필터 상태
  const [activeCategory, setActiveCategory] = useState("All");
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const colorMap = useMemo(() => buildCategoryColorMap(categories.map((c) => c.name)), [categories]);

  // 필터 변경 시 서버에서 page 1부터 재조회
  const refetch = useCallback(async (category: string, query: string) => {
    setIsResetting(true);
    const categorySlug = category !== "All"
      ? categories.find((c) => c.name === category)?.slug
      : undefined;

    const result = await getPosts({
      page: 1,
      limit: POSTS_PER_PAGE,
      sort,
      categorySlug,
      search: query.trim() || undefined,
      publishedOnly: true,
    });

    if (result.success) {
      setPosts(result.data.posts);
      setHasMore(result.data.hasMore);
      setPage(1);
    }
    setIsResetting(false);
  }, [categories, sort]);

  function handleSortChange(newSort: PostSortKey) {
    startTransition(() => {
      router.push(`?sort=${newSort}`, { scroll: false });
    });
  }

  function openSearch() {
    setIsSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    refetch(cat, searchQuery);
  }

  function handleSearch() {
    setSearchQuery(inputValue);
    refetch(activeCategory, inputValue);
  }

  // Escape 키로 검색창 닫기
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setInputValue("");
        if (searchQuery.trim()) {
          refetch(activeCategory, "");
        }
        setSearchQuery("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, searchQuery, activeCategory, refetch]);

  // 무한 스크롤: 다음 페이지 로드
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const categorySlug = activeCategory !== "All"
      ? categories.find((c) => c.name === activeCategory)?.slug
      : undefined;

    const nextPage = page + 1;
    const result = await getPosts({
      page: nextPage,
      limit: POSTS_PER_PAGE,
      sort,
      categorySlug,
      search: searchQuery.trim() || undefined,
      publishedOnly: true,
    });

    if (result.success) {
      setPosts((prev) => [...prev, ...result.data.posts]);
      setHasMore(result.data.hasMore);
      setPage(nextPage);
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, page, sort, activeCategory, searchQuery, categories]);

  // loadMore를 ref에 저장해 stale closure 방지
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  // IntersectionObserver로 sentinel 감지
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const [featured, ...rest] = posts;

  const featuredBadge =
    sort === "views" ? "Most Viewed" : sort === "oldest" ? "Oldest" : "Latest";

  const isLoading = isResetting || isPending;

  if (initialPosts.length === 0 && posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">아직 포스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-background/60 pt-32 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="font-mono text-[12px] text-muted-foreground">
              {isPending ? "정렬 중..." : "불러오는 중..."}
            </span>
          </div>
        </div>
      )}

      {/* 카테고리 필터 + 정렬 버튼 + 검색 */}
      <div className="border-b border-border pb-11">
        {/* 검색창 행 */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isSearchOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex items-center gap-2.5 pb-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="포스트 검색 후 Enter..."
                className="flex-1 bg-transparent font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setInputValue("");
                  if (searchQuery.trim()) refetch(activeCategory, "");
                  setSearchQuery("");
                }}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="검색 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 카테고리+정렬 행 */}
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          {/* 좌측: 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            {["All", ...categories.map((c) => c.name)].map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
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

          {/* 우측: 정렬 버튼 + 검색 아이콘 */}
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
            <div className="mx-1.5 h-4 w-px bg-border" />
            <button
              onClick={openSearch}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="검색"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 포스트 수 */}
      <div className="flex items-center gap-4 py-6">
        <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
          {searchQuery.trim()
            ? `${posts.length}${hasMore ? "+" : ""} results`
            : `${posts.length}${hasMore ? "+" : ""} posts`}
        </span>
        <div className="h-px flex-1" />
      </div>

      {posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">해당 조건의 포스트가 없습니다.</p>
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

      {/* 무한 스크롤 sentinel + 하단 상태 표시 */}
      <div ref={sentinelRef} className="flex h-16 items-center justify-center">
        {isLoadingMore && (
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="font-mono text-[12px] text-muted-foreground">불러오는 중...</span>
          </div>
        )}
        {!hasMore && posts.length > 0 && !isLoadingMore && (
          <span className="font-mono text-[11px] text-muted-foreground/50">— 모든 포스트를 불러왔습니다 —</span>
        )}
      </div>
    </div>
  );
}
