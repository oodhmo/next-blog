"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/category";
import type { AdminCategory } from "@/lib/actions/category";
import { cn } from "@/lib/utils";

type CategoryManagerProps = {
  initialCategories: AdminCategory[];
};

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<AdminCategory[]>(initialCategories);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [isPending, startTransition] = useTransition();

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function handleNewNameChange(value: string) {
    setNewName(value);
    if (!newSlug || newSlug === autoSlug(newName)) {
      setNewSlug(autoSlug(value));
    }
  }

  async function handleCreate() {
    startTransition(async () => {
      const result = await createCategory(newName, newSlug);
      if (result.success) {
        setCategories((prev) => [...prev, result.data]);
        setNewName("");
        setNewSlug("");
        setIsCreating(false);
        toast.success(`"${result.data.name}" 카테고리가 생성됐습니다`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleEditStart(cat: AdminCategory) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
  }

  async function handleEditSave(cat: AdminCategory) {
    startTransition(async () => {
      const result = await updateCategory(cat.id, editName, editSlug);
      if (result.success) {
        setCategories((prev) => prev.map((c) => (c.id === cat.id ? result.data : c)));
        setEditingId(null);
        toast.success("카테고리가 수정됐습니다");
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleDelete(cat: AdminCategory) {
    startTransition(async () => {
      const result = await deleteCategory(cat.id);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        toast.success(`"${cat.name}" 카테고리가 삭제됐습니다`);
      } else {
        toast.error(result.error);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* 헤더 + 생성 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-muted-foreground">
          총 {categories.length}개 카테고리
        </p>
        <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          새 카테고리
        </Button>
      </div>

      {/* 카테고리 목록 */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-[1fr_120px_80px_80px] items-center border-b border-border px-5 py-3">
          <span className="text-[13px] font-medium text-muted-foreground">이름</span>
          <span className="text-[13px] font-medium text-muted-foreground">슬러그</span>
          <span className="text-right text-[13px] font-medium text-muted-foreground">포스트 수</span>
          <span />
        </div>

        {/* 새 카테고리 입력 행 */}
        {isCreating && (
          <div className="grid grid-cols-[1fr_120px_80px_80px] items-center gap-2 border-b border-border px-5 py-3 bg-muted/20">
            <Input
              placeholder="카테고리 이름"
              aria-label="새 카테고리 이름"
              value={newName}
              onChange={(e) => handleNewNameChange(e.target.value)}
              className="h-8 text-[13px]"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Input
              placeholder="slug"
              aria-label="새 카테고리 슬러그"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="h-8 font-mono text-[12px]"
            />
            <span />
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={handleCreate}
                disabled={isPending || !newName || !newSlug}
                aria-label="카테고리 생성 확인"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { setIsCreating(false); setNewName(""); setNewSlug(""); }}
                aria-label="카테고리 생성 취소"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {categories.length === 0 && !isCreating ? (
          <div className="py-16 text-center text-[14px] text-muted-foreground">
            카테고리가 없습니다. 새 카테고리를 추가해보세요.
          </div>
        ) : (
          categories.map((cat, idx) => (
            <div
              key={cat.id}
              className={cn(
                "grid grid-cols-[1fr_120px_80px_80px] items-center px-5 py-4 transition-colors hover:bg-muted/30",
                idx < categories.length - 1 && "border-b border-border"
              )}
            >
              {editingId === cat.id ? (
                <>
                  <Input
                    value={editName}
                    aria-label="카테고리 이름 수정"
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-[13px]"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleEditSave(cat)}
                  />
                  <Input
                    value={editSlug}
                    aria-label="카테고리 슬러그 수정"
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="h-8 font-mono text-[12px]"
                  />
                  <span />
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleEditSave(cat)}
                      disabled={isPending}
                      aria-label="카테고리 수정 확인"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      aria-label="카테고리 수정 취소"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[14px] font-medium text-foreground">{cat.name}</span>
                  <span className="font-mono text-[12px] text-muted-foreground">{cat.slug}</span>
                  <span className="text-right font-mono text-[13px] text-foreground">
                    {cat._count.posts}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleEditStart(cat)}
                      aria-label={`"${cat.name}" 수정`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      aria-label={`"${cat.name}" 삭제`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">&quot;{deleteTarget?.name}&quot;</span> 카테고리를 삭제하시겠습니까?
              <br />
              {deleteTarget && deleteTarget._count.posts > 0 && (
                <span className="text-destructive">
                  이 카테고리는 {deleteTarget._count.posts}개 포스트에 연결되어 있습니다.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
