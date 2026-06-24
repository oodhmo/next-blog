"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, all } from "lowlight";
import { useEffect } from "react";
import { EditorToolbar } from "@/components/admin/EditorToolbar";

const lowlight = createLowlight(all);

// Tab 키를 에디터 내부에서 처리 (포커스 이동 방지)
const TabIndent = Extension.create({
  name: "tabIndent",
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.insertContent("  "),
    };
  },
});

interface PostEditorProps {
  slug?: string;
  initialContent?: string;
  onChange?: (text: string) => void;
  onHtmlChange?: (html: string) => void;
}

export function PostEditor({ slug, initialContent, onChange, onHtmlChange }: PostEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    content: initialContent || "",
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
        strike: false,
        codeBlock: false, // CodeBlockLowlight로 대체
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline underline-offset-2" },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
        HTMLAttributes: { class: "hljs" },
      }),
      TabIndent,
    ],
    editorProps: {
      attributes: { class: "outline-none min-h-full" },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      onChange?.(editor.getText());
      onHtmlChange?.(editor.getHTML());
    };
    // 에디터 초기화 직후 부모 state 동기화 (초기 콘텐츠 반영)
    handleUpdate();
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, onChange, onHtmlChange]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <EditorToolbar editor={editor} slug={slug} />

      {/* 에디터 콘텐츠 영역 — 빈 공간 클릭 시에도 포커스 전달 */}
      <div
        className="flex-1 cursor-text overflow-auto px-12 py-8"
        onClick={(e) => {
          // 에디터 내부 클릭은 ProseMirror가 직접 처리하므로 무시
          if ((e.target as HTMLElement).closest(".ProseMirror")) return;
          editor?.commands.focus("end");
        }}
      >
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  );
}
