"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatsCards } from "@/components/admin/stats-cards";
import { PostTable } from "@/components/admin/post-table";
import { CategoryManager } from "@/components/admin/category-manager";
import type { AdminCategory, AdminTag } from "@/lib/actions/category";
import { cn } from "@/lib/utils";

type Tab = "posts" | "categories";

type AdminViewProps = {
  stats: { total: number; published: number; unpublished: number };
  initialCategories: AdminCategory[];
  initialTags: AdminTag[];
};

export function AdminView({ stats, initialCategories, initialTags }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-foreground">
              {activeTab === "posts" ? "포스트 관리" : "카테고리 관리"}
            </h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              {activeTab === "posts"
                ? "글을 작성하고, 공개 상태와 카테고리를 관리하세요."
                : "카테고리를 생성하고 수정하거나 삭제하세요."}
            </p>
          </div>

          <div className="flex overflow-hidden rounded-xl border border-border bg-card">
            <button
              onClick={() => setActiveTab("posts")}
              className={cn(
                "px-5 py-2.5 text-[13px] font-medium transition-colors",
                activeTab === "posts"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              포스트
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={cn(
                "px-5 py-2.5 text-[13px] font-medium transition-colors",
                activeTab === "categories"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              카테고리
            </button>
          </div>
        </div>

        {activeTab === "posts" && (
          <div className="mb-6">
            <StatsCards stats={stats} />
          </div>
        )}

        {activeTab === "posts" ? (
          <PostTable categories={initialCategories} tags={initialTags} />
        ) : (
          <CategoryManager initialCategories={initialCategories} />
        )}
      </main>
    </div>
  );
}
