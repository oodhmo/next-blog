"use client";

import type { Editor } from "@tiptap/react";
import { useCallback } from "react";
import { Bold, Italic, Code, FileCode, Link, Quote, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
  slug?: string;
}

export function EditorToolbar({ editor, slug }: EditorToolbarProps) {
  const handleLinkInsert = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("링크 URL을 입력하세요");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

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
      >
        <Bold className="h-3.5 w-3.5 stroke-[2.5]" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className={cn(btn(editor?.isActive("italic") ?? false), "w-7")}
        title="Italic"
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
      >
        <Code className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        className={cn(btn(editor?.isActive("codeBlock") ?? false), "w-7")}
        title="코드 블록"
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
      >
        <Link className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        className={cn(btn(editor?.isActive("blockquote") ?? false), "w-7")}
        title="인용구"
      >
        <Quote className="h-3.5 w-3.5" />
      </button>
      {/* TODO: 이미지 업로드 기능 - 추후 단계에서 구현 */}
      <button
        type="button"
        className={cn(btn(false), "w-7")}
        title="이미지 (준비 중)"
      >
        <Image className="h-3.5 w-3.5" />
      </button>

      <div className="flex-1" />

      {slug && (
        <span className="font-mono text-[10.5px] text-muted-foreground opacity-70">
          posts/{slug}.mdx
        </span>
      )}
    </div>
  );
}
