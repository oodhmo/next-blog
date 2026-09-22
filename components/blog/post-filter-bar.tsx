"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostSortKey } from "@/types";

type Category = { name: string; slug: string };

const SORT_OPTIONS: { key: PostSortKey; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "oldest", label: "오래된순" },
  { key: "views", label: "조회수순" },
];

type PostFilterBarProps = {
  categories: Category[];
  activeCategory: string;
  sort: PostSortKey;
  isSearchOpen: boolean;
  isPending: boolean;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onCategoryChange: (cat: string) => void;
  onSortChange: (sort: PostSortKey) => void;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  onSearchSubmit: (value: string) => void;
};

export function PostFilterBar({
  categories,
  activeCategory,
  sort,
  isSearchOpen,
  isPending,
  searchInputRef,
  onCategoryChange,
  onSortChange,
  onSearchOpen,
  onSearchClose,
  onSearchSubmit,
}: PostFilterBarProps) {
  // 입력값은 이 컴포넌트가 직접 들고 있는다. 부모(PostList)가 매 타이핑마다
  // 리렌더되면 포스트 카드 그리드 전체가 같이 리렌더되므로, 검색창이 닫히면
  // 이 안에서만 값을 비운다.
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!isSearchOpen) setInputValue("");
  }, [isSearchOpen]);

  return (
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
                if (e.key === "Enter") onSearchSubmit(inputValue);
              }}
              aria-label="포스트 검색"
              placeholder="포스트 검색 후 Enter..."
              className="flex-1 bg-transparent font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={onSearchClose}
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
              onClick={() => onCategoryChange(cat)}
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
              onClick={() => onSortChange(key)}
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
            onClick={onSearchOpen}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="검색"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
