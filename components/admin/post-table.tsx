"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdminPosts, deletePost, togglePostPublished, bulkUpdatePosts } from "@/lib/actions/post";
import type { AdminPost } from "@/lib/actions/post";
import type { AdminCategory, AdminTag } from "@/lib/actions/category";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

const ADMIN_PAGE_SIZE = 6;

type PublishedFilter = "all" | "published" | "unpublished";
type SortKey = "latest" | "views" | "updatedAt";

type PostTableProps = {
  categories: AdminCategory[];
  tags: AdminTag[];
};

export function PostTable({ categories, tags }: PostTableProps) {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>("all");
  const [sort, setSort] = useState<SortKey>("latest");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isLoading, startTransition] = useTransition();

  const debouncedSearch = useDebounce(search, 400);

  const fetchPosts = useCallback(() => {
    startTransition(async () => {
      const result = await getAdminPosts({
        page,
        limit: ADMIN_PAGE_SIZE,
        search: debouncedSearch || undefined,
        categorySlug: categoryFilter !== "all" ? categoryFilter : undefined,
        tagSlug: tagFilter !== "all" ? tagFilter : undefined,
        publishedFilter,
        sort,
      });
      if (result.success) {
        setPosts(result.data.posts);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
        setSelectedIds([]);
      }
    });
  }, [page, debouncedSearch, categoryFilter, tagFilter, publishedFilter, sort]);

  // fetchPosts는 page를 포함한 모든 필터를 의존성으로 갖는다. 필터가 바뀔 때
  // 페이지를 1로 리셋하는 것은 각 필터 변경 핸들러(아래)에서 setPage(1)을
  // 함께 호출하는 방식으로 처리한다. 예전에는 별도 effect로 setPage(1)을
  // 호출했는데, 그러면 필터 변경 1회당 (이전 page로) fetchPosts가 한 번,
  // page가 1로 바뀌어 다시 한 번 — 총 두 번 서버 액션이 호출됐다.
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryFilterChange(value: string) {
    setCategoryFilter(value);
    setPage(1);
  }

  function handleTagFilterChange(value: string) {
    setTagFilter(value);
    setPage(1);
  }

  function handlePublishedFilterChange(value: PublishedFilter) {
    setPublishedFilter(value);
    setPage(1);
  }

  function handleSortChange(value: SortKey) {
    setSort(value);
    setPage(1);
  }

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? posts.map((p) => p.id) : []);
  }

  function handleSelectOne(id: number, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  async function handleDelete(post: AdminPost) {
    const result = await deletePost(post.id);
    if (result.success) {
      toast.success(`"${post.title}" 삭제 완료`);
      fetchPosts();
    } else {
      toast.error(result.error);
    }
    setDeleteTarget(null);
  }

  async function handleTogglePublished(post: AdminPost) {
    const next = !post.published;
    const result = await togglePostPublished(post.id, next);
    if (result.success) {
      toast.success(next ? "공개로 변경됐습니다" : "비공개로 변경됐습니다");
      fetchPosts();
    } else {
      toast.error(result.error);
    }
  }

  async function handleBulkAction(action: "publish" | "unpublish" | "delete") {
    const result = await bulkUpdatePosts(selectedIds, action);
    if (result.success) {
      const labels = { publish: "공개", unpublish: "비공개", delete: "삭제" };
      toast.success(`${selectedIds.length}개 포스트 ${labels[action]} 완료`);
      fetchPosts();
    } else {
      toast.error(result.error);
    }
    setIsBulkDeleteOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* 검색 + 필터 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="포스트 제목 검색..."
            aria-label="포스트 제목 검색"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
          <SelectTrigger className="w-[148px]">
            <SelectValue placeholder="모든 카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 카테고리</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={handleTagFilterChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="모든 태그" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 태그</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.slug} value={t.slug}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => handleSortChange(v as SortKey)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">최신순</SelectItem>
            <SelectItem value="views">조회수순</SelectItem>
            <SelectItem value="updatedAt">수정일순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 공개 필터 탭 + 일괄 액션 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {(["all", "published", "unpublished"] as const).map((filter) => {
            const labels = { all: "전체", published: "공개", unpublished: "비공개" };
            return (
              <button
                key={filter}
                onClick={() => handlePublishedFilterChange(filter)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
                  publishedFilter === filter
                    ? "bg-primary text-white"
                    : "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {labels[filter]}
                {filter === "all" && ` ${total}`}
              </button>
            );
          })}
        </div>

        {/* 일괄 액션 */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground">{selectedIds.length}개 선택</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("publish")}
            >
              공개
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("unpublish")}
            >
              비공개
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteOpen(true)}
            >
              삭제
            </Button>
          </div>
        )}
      </div>

      {/* 테이블 */}
      <div className={cn("rounded-xl border border-border bg-card overflow-hidden", isLoading && "opacity-60 pointer-events-none")}>
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-[40px_1fr_160px_100px_90px_140px_96px] items-center border-b border-border px-4 py-3">
          <Checkbox
            checked={selectedIds.length === posts.length && posts.length > 0}
            onCheckedChange={(c) => handleSelectAll(!!c)}
            aria-label="전체 선택"
          />
          <span className="text-[13px] font-medium text-muted-foreground">제목</span>
          <span className="text-[13px] font-medium text-muted-foreground">카테고리</span>
          <span className="text-[13px] font-medium text-muted-foreground">상태</span>
          <span className="pr-6 text-center text-[13px] font-medium text-muted-foreground">조회수</span>
          <span className="text-center text-[13px] font-medium text-muted-foreground">수정일</span>
          <span className="text-right text-[13px] font-medium text-muted-foreground" />
        </div>

        {/* 포스트 행 */}
        {posts.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-muted-foreground">
            {isLoading ? "로딩 중..." : "포스트가 없습니다."}
          </div>
        ) : (
          posts.map((post, idx) => (
            <div
              key={post.id}
              className={cn(
                "grid grid-cols-[40px_1fr_160px_100px_90px_140px_96px] items-center px-4 py-4 transition-colors hover:bg-muted/30",
                idx < posts.length - 1 && "border-b border-border"
              )}
            >
              <Checkbox
                checked={selectedIds.includes(post.id)}
                onCheckedChange={(c) => handleSelectOne(post.id, !!c)}
                aria-label={`"${post.title}" 선택`}
              />

              {/* 제목 + 태그 */}
              <div className="min-w-0 pr-4">
                <p className="truncate text-[14px] font-medium text-foreground">{post.title}</p>
                <p className="mt-0.5 truncate font-mono text-[12px] text-muted-foreground">
                  {post.tags.map((t) => `#${t.tag.name}`).join(" ")}
                </p>
              </div>

              {/* 카테고리 배지 */}
              <div className="flex flex-wrap gap-1">
                {post.categories.slice(0, 2).map(({ category }) => (
                  <span
                    key={category.id}
                    className="rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide"
                    style={{ borderColor: "#e5e7eb", color: "#6b7280" }}
                  >
                    {category.name}
                  </span>
                ))}
              </div>

              {/* 공개 상태 토글 */}
              <button
                onClick={() => handleTogglePublished(post)}
                className="flex items-center gap-1.5 text-[13px] transition-opacity hover:opacity-70"
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    post.published ? "bg-primary" : "bg-muted-foreground"
                  )}
                />
                <span className={post.published ? "text-primary font-medium" : "text-muted-foreground"}>
                  {post.published ? "공개" : "비공개"}
                </span>
              </button>

              {/* 조회수 */}
              <p className="pr-6 text-center font-mono text-[13px] text-foreground">
                {post.viewCount.toLocaleString()}
              </p>

              {/* 수정일 */}
              <p className="text-center font-mono text-[13px] text-muted-foreground">
                {new Date(post.updatedAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </p>

              {/* 편집/삭제 */}
              <div className="flex items-center justify-end gap-1">
                <Link
                  href={`/studio-sy/editor/${post.id}`}
                  aria-label={`"${post.title}" 수정`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => setDeleteTarget(post)}
                  aria-label={`"${post.title}" 삭제`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-[13px] text-muted-foreground">
            {(page - 1) * ADMIN_PAGE_SIZE + 1}-{Math.min(page * ADMIN_PAGE_SIZE, total)} / {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="이전 페이지"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[13px] font-medium transition-colors",
                      page === p
                        ? "bg-primary text-white"
                        : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="다음 페이지"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 단일 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>포스트 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">&quot;{deleteTarget?.title}&quot;</span>을 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일괄 삭제 확인 다이얼로그 */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>포스트 일괄 삭제</DialogTitle>
            <DialogDescription>
              선택한 <span className="font-medium text-foreground">{selectedIds.length}개</span> 포스트를 모두 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={() => handleBulkAction("delete")}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
