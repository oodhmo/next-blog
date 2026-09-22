"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
import { Bold, Italic, Code, FileCode, Link, Quote, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
  slug?: string;
}

export function EditorToolbar({ editor, slug }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLinkInsert = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("링크 URL을 입력하세요");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor || !e.target.files?.length) return;
      const files = Array.from(e.target.files);
      e.target.value = "";

      setIsUploading(true);
      for (const file of files) {
        try {
          // presigned URL 요청
          const res = await fetch("/api/upload/presigned", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              size: file.size,
            }),
          });

          if (!res.ok) {
            const { error } = await res.json();
            toast.error(`${file.name}: ${error ?? "업로드 실패"}`);
            continue;
          }

          const { uploadUrl, viewUrl, key } = await res.json();

          // S3에 직접 업로드
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          if (!uploadRes.ok) {
            toast.error(`${file.name}: S3 업로드에 실패했습니다`);
            continue;
          }

          // src: 에디터 미리보기용 presigned URL, data-s3-key: 저장용 key
          editor.chain().focus().insertContent({
            type: "image",
            attrs: { src: viewUrl, alt: file.name, "data-s3-key": key },
          }).run();
        } catch {
          toast.error(`${file.name}: 업로드 중 오류가 발생했습니다`);
        }
      }
      setIsUploading(false);
    },
    [editor]
  );

  const btn = (active: boolean) =>
    cn(
      "flex h-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
      active && "bg-secondary text-foreground"
    );

  return (
    <div className="flex h-[42px] flex-shrink-0 items-center gap-0.5 border-b border-border px-5">
      {/* 헤딩 */}
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(btn(editor?.isActive("heading", { level: 1 }) ?? false), "w-8 font-mono text-[11px] font-semibold")}
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(btn(editor?.isActive("heading", { level: 2 }) ?? false), "w-8 font-mono text-[11px] font-semibold")}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(btn(editor?.isActive("heading", { level: 3 }) ?? false), "w-8 font-mono text-[11px] font-semibold")}
        title="Heading 3"
      >
        H3
      </button>

      <div className="mx-1 h-4 w-px bg-border" />

      {/* Bold / Italic */}
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleBold().run()}
        className={cn(btn(editor?.isActive("bold") ?? false), "w-7")}
        title="Bold"
        aria-label="굵게"
      >
        <Bold className="h-3.5 w-3.5 stroke-[2.5]" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className={cn(btn(editor?.isActive("italic") ?? false), "w-7")}
        title="Italic"
        aria-label="기울임"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-4 w-px bg-border" />

      {/* Code */}
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleCode().run()}
        className={cn(btn(editor?.isActive("code") ?? false), "w-7")}
        title="인라인 코드"
        aria-label="인라인 코드"
      >
        <Code className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        className={cn(btn(editor?.isActive("codeBlock") ?? false), "w-7")}
        title="코드 블록"
        aria-label="코드 블록"
      >
        <FileCode className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-4 w-px bg-border" />

      {/* Link / Quote / Image */}
      <button
        type="button"
        onClick={handleLinkInsert}
        className={cn(btn(editor?.isActive("link") ?? false), "w-7")}
        title="링크"
        aria-label="링크 삽입"
      >
        <Link className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        className={cn(btn(editor?.isActive("blockquote") ?? false), "w-7")}
        title="인용구"
        aria-label="인용구"
      >
        <Quote className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || !editor}
        className={cn(btn(false), "w-7", (isUploading || !editor) && "cursor-not-allowed opacity-50")}
        title={isUploading ? "업로드 중..." : "이미지 삽입"}
        aria-label={isUploading ? "업로드 중" : "이미지 삽입"}
      >
        {isUploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          // lucide-react의 아이콘 컴포넌트로 실제 <img>가 아니다. jsx-a11y/alt-text가
          // 태그명("Image")만 보고 오탐하며, LucideProps에 alt가 없어 prop으로는
          // 규칙을 만족시킬 수 없다. 버튼에 이미 aria-label이 있어 장식용으로 안전하다.
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image className="h-3.5 w-3.5" />
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />

      <div className="flex-1" />

      {slug && (
        <span className="font-mono text-[10.5px] text-muted-foreground opacity-70">
          posts/{slug}.mdx
        </span>
      )}
    </div>
  );
}
