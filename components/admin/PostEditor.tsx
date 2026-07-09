"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { ResizableImageView } from "@/components/admin/ResizableImageView";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
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

// data-s3-key, width, height 속성 + 리사이즈 핸들(NodeView) 지원 커스텀 이미지 확장
const CustomImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-s3-key": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-s3-key"),
        renderHTML: (attributes) =>
          attributes["data-s3-key"] ? { "data-s3-key": attributes["data-s3-key"] } : {},
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const val = element.getAttribute("width");
          return val ? Number(val) : null;
        },
        renderHTML: (attributes) =>
          attributes.width ? { width: String(attributes.width) } : {},
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const val = element.getAttribute("height");
          return val ? Number(val) : null;
        },
        renderHTML: (attributes) =>
          attributes.height ? { height: String(attributes.height) } : {},
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
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
        codeBlock: false,
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
      CustomImage.configure({
        HTMLAttributes: { class: "max-w-full rounded-lg my-2" },
        allowBase64: false,
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

      // img[data-s3-key]의 src를 key 값으로 교체 (DB 저장용 HTML 생성)
      // DOM 조작 대신 정규식으로 처리 — detached img에 src 설정 시 브라우저가
      // S3 key를 상대 URL로 해석해 네트워크 요청을 발생시키는 문제 방지
      const html = editor.getHTML();
      const processed = html.replace(
        /<img\b[^>]*data-s3-key="[^"]*"[^>]*>/gi,
        (imgTag) => {
          const keyMatch = imgTag.match(/data-s3-key="([^"]*)"/);
          if (!keyMatch) return imgTag;
          const key = keyMatch[1];
          return imgTag
            .replace(/\bsrc="[^"]*"/, `src="${key}"`)
            .replace(/\s?data-s3-key="[^"]*"/, "");
        }
      );
      onHtmlChange?.(processed);
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
          if ((e.target as HTMLElement).closest(".ProseMirror")) return;
          editor?.commands.focus("end");
        }}
      >
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  );
}
