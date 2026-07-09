"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarIcon, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PostEditor } from "@/components/admin/PostEditor";
import { computeEditorStats } from "@/lib/editor-stats";
import { saveEditorPost, updateEditorPost } from "@/lib/actions/post";
import { deleteComment } from "@/lib/actions/comment";
import { generateSlug, cn } from "@/lib/utils";
import type { AdminCategory } from "@/lib/actions/category";
import type { PostWithRelations, CommentWithUser } from "@/types";

interface PostEditorPageProps {
  categories: AdminCategory[];
  post?: PostWithRelations;
  initialComments?: CommentWithUser[];
  initialEditorContent?: string; // 에디터 표시용 (presigned URL + data-s3-key 포함)
}

export function PostEditorPage({ categories, post, initialComments, initialEditorContent }: PostEditorPageProps) {
  const router = useRouter();
  const isEditMode = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags.map((t) => t.tag.name) ?? []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">(
    post?.published ? "published" : "draft"
  );
  const [publishDate, setPublishDate] = useState<Date | undefined>(
    post?.publishedAt ?? new Date()
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(
    post?.categories[0]?.category.id.toString() ?? ""
  );
  const [editorText, setEditorText] = useState("");
  const [editorHtml, setEditorHtml] = useState(post?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const [comments, setComments] = useState<CommentWithUser[]>(initialComments ?? []);

  const stats = computeEditorStats(editorText);
  const slug = isEditMode ? post.slug : (generateSlug(title) || "untitled");

  const handleEditorChange = useCallback((text: string) => {
    setEditorText(text);
  }, []);

  const handleEditorHtmlChange = useCallback((html: string) => {
    setEditorHtml(html);
  }, []);

  const handleSave = async (targetStatus: "draft" | "published") => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }
    if (!categoryId) {
      toast.error("카테고리를 선택해주세요");
      return;
    }

    setIsSaving(true);

    const payload = {
      title,
      content: editorHtml,
      excerpt: excerpt.trim() || undefined,
      tagNames: tags,
      categoryId,
      published: targetStatus === "published",
      publishedAt: publishDate,
    };

    const result = isEditMode
      ? await updateEditorPost(post.id, payload)
      : await saveEditorPost(payload);

    setIsSaving(false);

    if (result.success) {
      toast.success(targetStatus === "published" ? "포스트가 발행됐습니다" : "초안이 저장됐습니다");
      router.push("/studio-sy");
    } else {
      toast.error(result.error);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags((prev) => [...prev, newTag]);
        toast.success(`태그 추가됨: ${newTag}`);
      }
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleDeleteComment = async (commentId: number) => {
    const result = await deleteComment(commentId);
    if (result.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("댓글이 삭제됐습니다");
    } else {
      toast.error(result.error);
    }
  };

  const statusBtnClass = (s: "draft" | "published") =>
    cn(
      "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
      status === s
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-transparent text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* 헤더 */}
      <header className="z-50 flex h-14 flex-shrink-0 items-center gap-3 border-b border-border bg-background/90 px-5 backdrop-blur-xl">
        <NextLink
          href="/studio-sy"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </NextLink>

        <div className="h-[18px] w-px flex-shrink-0 bg-border" />

        <div className="flex flex-shrink-0 items-center gap-1.5 font-mono text-[11.5px] text-muted-foreground">
          <span>posts</span>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="font-medium text-foreground">
            {isEditMode ? "수정" : "new post"}
          </span>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="min-w-0 flex-1 bg-transparent text-center text-[15px] font-semibold text-foreground outline-none placeholder:text-muted-foreground/45"
        />

        <span className="flex-shrink-0 font-mono text-[10.5px] text-muted-foreground">
          {stats.wordCount}어절 · {stats.charCount}자
        </span>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3.5 text-[12.5px]"
            onClick={() => handleSave("draft")}
            disabled={isSaving}
          >
            {isSaving ? "저장 중..." : "Draft 저장"}
          </Button>
          <Button
            size="sm"
            className="h-8 px-3.5 text-[12.5px]"
            onClick={() => handleSave("published")}
            disabled={isSaving}
          >
            {isSaving ? "저장 중..." : "발행하기"}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* 본문 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 에디터 메인 */}
        <main className="flex flex-1 flex-col overflow-hidden border-r border-border">
          <PostEditor
            slug={slug}
            initialContent={initialEditorContent ?? post?.content}
            onChange={handleEditorChange}
            onHtmlChange={handleEditorHtmlChange}
          />
        </main>

        {/* 사이드바 */}
        <aside className="flex w-[280px] flex-shrink-0 flex-col overflow-y-auto">
          {/* 상태 */}
          <div className="border-b border-border p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
              상태
            </p>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setStatus("draft")} className={statusBtnClass("draft")}>
                Draft
              </button>
              <button type="button" onClick={() => setStatus("published")} className={statusBtnClass("published")}>
                Published
              </button>
            </div>
          </div>

          {/* 카테고리 */}
          <div className="border-b border-border p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
              카테고리
            </p>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-8 w-full font-mono text-[11.5px]">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <div className="px-2 py-4 text-center font-mono text-[11px] text-muted-foreground">
                    등록된 카테고리 없음
                  </div>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()} className="font-mono text-[12px]">
                      {cat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 태그 */}
          <div className="border-b border-border p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
              태그
            </p>
            {tags.length > 0 && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-secondary-foreground"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="flex h-3 w-3 items-center justify-center opacity-60 hover:opacity-100"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="태그 입력 후 Enter"
              className="h-8 font-mono text-[11.5px]"
            />
          </div>

          {/* 요약 */}
          <div className="border-b border-border p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
              요약
            </p>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="포스트 요약 (목록에 표시됩니다)"
              rows={4}
              className="block w-full resize-y rounded-lg border border-border bg-input p-2.5 font-sans text-[12.5px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground/45 focus:border-primary"
            />
          </div>

          {/* 정보 */}
          <div className="border-b border-border p-5">
            <p className="mb-3.5 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
              정보
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground">어절 수</span>
                <span className="font-mono text-[11px] font-medium text-foreground">{stats.wordCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground">글자 수</span>
                <div className="text-right">
                  <span className="font-mono text-[11px] font-medium text-foreground">{stats.charCount}</span>
                  {(stats.koreanChars > 0 || stats.englishChars > 0) && (
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      한 {stats.koreanChars} · 영 {stats.englishChars}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground">읽기 시간</span>
                <span className="font-mono text-[11px] font-medium text-foreground">약 {stats.readTime}분</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground">파일</span>
                <span className="font-mono text-[10px] text-primary">{slug}.mdx</span>
              </div>
            </div>
          </div>

          {/* 발행일 */}
          <div className={cn("p-5", isEditMode && comments.length > 0 && "border-b border-border")}>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
              발행일
            </p>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-8 w-full items-center gap-2 rounded-md border border-input bg-background px-3 font-mono text-[11.5px] text-left transition-colors hover:border-primary focus:outline-none",
                    !publishDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  {publishDate
                    ? format(publishDate, "yyyy년 MM월 dd일", { locale: ko })
                    : "날짜 선택"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={publishDate}
                  onSelect={(date) => {
                    setPublishDate(date);
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 댓글 (편집 모드에서만 표시) */}
          {isEditMode && (
            <div className="p-5">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
                댓글 <span className="ml-1 text-foreground">{comments.length}</span>
              </p>

              {comments.length === 0 ? (
                <p className="font-mono text-[11px] text-muted-foreground">댓글이 없습니다</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block truncate font-mono text-[11px] font-medium text-foreground">
                            {comment.user.name ?? "익명"}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {format(new Date(comment.createdAt), "MM.dd HH:mm")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="댓글 삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-[12px] leading-relaxed text-foreground">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
