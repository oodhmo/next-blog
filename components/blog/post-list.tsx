"use client";

import { useState, useTransition, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FeaturedPostCard } from "@/components/blog/featured-post-card";
import { PostCard } from "@/components/blog/post-card";
import { PostFilterBar } from "@/components/blog/post-filter-bar";
import { buildCategoryColorMap } from "@/lib/category-colors";
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

export function PostList({ initialPosts, initialHasMore, categories, sort }: PostListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 포스트 목록 상태
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const isLoadingMoreRef = useRef(false); // IntersectionObserver 중복 호출 방지 (동기 guard)
  const [isLoadingMore, setIsLoadingMore] = useState(false); // UI 표시용
  const [isResetting, setIsResetting] = useState(false);

  // 필터 상태
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const colorMap = useMemo(() => buildCategoryColorMap(categories.map((c) => c.name)), [categories]);

  // 진행 중인 요청들 중 "가장 마지막에 시작된" 요청만 결과를 반영하기 위한 세대(generation) 카운터.
  // 카테고리를 빠르게 전환하거나, loadMore 도중 필터가 바뀌는 경우
  // 늦게 도착한 이전 요청의 응답이 최신 상태를 덮어쓰는 레이스 컨디션을 막는다.
  const requestIdRef = useRef(0);

  // 필터 변경 시 서버에서 page 1부터 재조회
  const refetch = useCallback(async (category: string, query: string) => {
    const requestId = ++requestIdRef.current;
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

    if (requestId !== requestIdRef.current) return; // 그 사이 더 최신 요청이 시작됨 → 이 응답은 폐기

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

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  // activeCategory/searchQuery를 참조하므로 useCallback으로 감싸 최신 값을
  // 안정적으로 캡처하고, 아래 Escape 키 effect의 의존성 배열에 안전하게 넣을 수 있게 한다.
  // (이전에는 effect의 deps에 activeCategory가 빠져 있어, 카테고리를 바꾼 뒤 Escape로
  // 검색을 닫으면 이전 카테고리로 refetch되는 버그가 있었다.)
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    if (searchQuery.trim()) refetch(activeCategory, "");
    setSearchQuery("");
  }, [activeCategory, searchQuery, refetch]);

  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat);
    refetch(cat, searchQuery);
  }, [searchQuery, refetch]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    refetch(activeCategory, value);
  }, [activeCategory, refetch]);

  // Escape 키로 검색창 닫기
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  // 무한 스크롤: 다음 페이지 로드
  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMore) return;
    // refetch가 이미 새 세대를 시작했다면(필터 전환 등) 이 loadMore는 시작하지 않는다.
    const requestId = requestIdRef.current;
    isLoadingMoreRef.current = true;
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

    isLoadingMoreRef.current = false;
    setIsLoadingMore(false);

    // 응답을 기다리는 동안 카테고리/검색이 바뀌어 refetch가 새로 시작됐다면
    // 이 응답은 다른 필터 조건의 결과이므로 목록에 이어붙이지 않는다.
    if (requestId !== requestIdRef.current) return;

    if (result.success) {
      setPosts((prev) => [...prev, ...result.data.posts]);
      setHasMore(result.data.hasMore);
      setPage(nextPage);
    }
  }, [hasMore, page, sort, activeCategory, searchQuery, categories]);

  // loadMore를 ref에 저장해 stale closure 방지
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  // IntersectionObserver로 sentinel 감지.
  // 콜백 ref를 사용해 sentinel DOM 노드가 (조건부 렌더링으로) 나중에 마운트되더라도
  // 그 시점에 observer를 다시 연결한다. useEffect(deps=[])로 한 번만 등록하면
  // 최초 렌더에 sentinel이 없던 경우(포스트 0개 상태) observer가 영영 붙지 않는 문제가 있었다.
  const observerInstanceRef = useRef<IntersectionObserver | null>(null);
  const sentinelCallbackRef = useCallback((node: HTMLDivElement | null) => {
    observerInstanceRef.current?.disconnect();
    observerInstanceRef.current = null;

    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    observerInstanceRef.current = observer;
  }, []);

  const [featured, ...rest] = posts;
  const featuredBadge = sort === "views" ? "Most Viewed" : sort === "oldest" ? "Oldest" : "Latest";
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

      <PostFilterBar
        categories={categories}
        activeCategory={activeCategory}
        sort={sort}
        isSearchOpen={isSearchOpen}
        isPending={isPending}
        searchInputRef={searchInputRef}
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
        onSearchOpen={openSearch}
        onSearchClose={closeSearch}
        onSearchSubmit={handleSearch}
      />

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
      <div ref={sentinelCallbackRef} className="flex h-16 items-center justify-center">
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
