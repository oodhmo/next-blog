"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useCallback, useEffect, useRef } from "react";

const MAX_WIDTH = 672;
const MIN_SIZE = 50;

type HandlePosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

const HANDLES: HandlePosition[] = [
  "top-left", "top-center", "top-right",
  "middle-left", "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
];

const HANDLE_LABELS: Record<HandlePosition, string> = {
  "top-left": "왼쪽 위",
  "top-center": "위",
  "top-right": "오른쪽 위",
  "middle-left": "왼쪽",
  "middle-right": "오른쪽",
  "bottom-left": "왼쪽 아래",
  "bottom-center": "아래",
  "bottom-right": "오른쪽 아래",
};

function getHandleStyle(handle: HandlePosition): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 8,
    height: 8,
    background: "white",
    border: "1.5px solid #3b82f6",
    borderRadius: 1,
    zIndex: 10,
  };

  switch (handle) {
    case "top-left":      return { ...base, top: -4, left: -4, cursor: "nwse-resize" };
    case "top-center":    return { ...base, top: -4, left: "calc(50% - 4px)", cursor: "ns-resize" };
    case "top-right":     return { ...base, top: -4, right: -4, cursor: "nesw-resize" };
    case "middle-left":   return { ...base, top: "calc(50% - 4px)", left: -4, cursor: "ew-resize" };
    case "middle-right":  return { ...base, top: "calc(50% - 4px)", right: -4, cursor: "ew-resize" };
    case "bottom-left":   return { ...base, bottom: -4, left: -4, cursor: "nesw-resize" };
    case "bottom-center": return { ...base, bottom: -4, left: "calc(50% - 4px)", cursor: "ns-resize" };
    case "bottom-right":  return { ...base, bottom: -4, right: -4, cursor: "nwse-resize" };
  }
}

export function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width, height } = node.attrs as {
    src: string;
    alt?: string;
    width?: number | null;
    height?: number | null;
    "data-s3-key"?: string | null;
  };

  const imgRef = useRef<HTMLImageElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // 드래그 중 언마운트 시 document 이벤트 리스너 누수 방지
  useEffect(() => () => { cleanupRef.current?.(); }, []);

  // 처음 삽입 시(width 없음) naturalWidth > MAX_WIDTH이면 자동 축소
  const onLoad = useCallback(() => {
    if (width != null) return;
    const img = imgRef.current;
    if (!img) return;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    if (naturalW > MAX_WIDTH) {
      const ratio = MAX_WIDTH / naturalW;
      updateAttributes({ width: MAX_WIDTH, height: Math.round(naturalH * ratio) });
    }
  }, [width, updateAttributes]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent, handle: HandlePosition) => {
      e.preventDefault();
      e.stopPropagation();

      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = rect.width;
      const startH = rect.height;
      const aspectRatio = startW / startH;

      const onMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        // 상하 전용 핸들
        if (handle === "top-center" || handle === "bottom-center") {
          const newH = Math.max(
            MIN_SIZE,
            Math.round(handle === "bottom-center" ? startH + dy : startH - dy)
          );
          updateAttributes({ height: newH });
          return;
        }

        // 너비 계산 (좌우 방향 결정)
        let newW: number;
        if (handle.includes("right")) {
          newW = Math.round(startW + dx);
        } else {
          newW = Math.round(startW - dx);
        }
        newW = Math.min(MAX_WIDTH, Math.max(MIN_SIZE, newW));

        // 좌우 전용 핸들: 너비만 변경
        if (handle === "middle-left" || handle === "middle-right") {
          updateAttributes({ width: newW });
          return;
        }

        // 코너 핸들: 비율 유지
        const newH = Math.round(newW / aspectRatio);
        updateAttributes({ width: newW, height: newH });
      };

      const cleanup = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        cleanupRef.current = null;
      };
      const onMouseUp = () => cleanup();
      cleanupRef.current = cleanup;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [updateAttributes]
  );

  // 마우스 드래그와 동일한 리사이즈를 방향키로도 할 수 있게 한다
  // (기존에는 핸들이 aria-hidden + onMouseDown만 있어 키보드로는 크기 조절이 불가능했다).
  const onHandleKeyDown = useCallback(
    (e: React.KeyboardEvent, handle: HandlePosition) => {
      const step = e.shiftKey ? 20 : 8;
      let dx = 0;
      let dy = 0;
      switch (e.key) {
        case "ArrowLeft": dx = -step; break;
        case "ArrowRight": dx = step; break;
        case "ArrowUp": dy = -step; break;
        case "ArrowDown": dy = step; break;
        default: return;
      }
      e.preventDefault();

      const img = imgRef.current;
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const startW = rect.width;
      const startH = rect.height;
      const aspectRatio = startW / startH;

      if (handle === "top-center" || handle === "bottom-center") {
        const newH = Math.max(
          MIN_SIZE,
          Math.round(handle === "bottom-center" ? startH + dy : startH - dy)
        );
        updateAttributes({ height: newH });
        return;
      }

      let newW = Math.round(handle.includes("right") ? startW + dx : startW - dx);
      newW = Math.min(MAX_WIDTH, Math.max(MIN_SIZE, newW));

      if (handle === "middle-left" || handle === "middle-right") {
        updateAttributes({ width: newW });
        return;
      }

      const newH = Math.round(newW / aspectRatio);
      updateAttributes({ width: newW, height: newH });
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper
      as="div"
      style={{
        display: "inline-block",
        position: "relative",
        lineHeight: 0,
        margin: "0.5rem 0",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element --
          TipTap NodeView: naturalWidth/Height 측정 + 드래그 리사이즈가 필요해
          next/image로 대체할 수 없다(고정 크기 사전 지정을 요구해 편집 중 자유
          리사이즈와 충돌). 관리자 전용 에디터 화면이라 LCP 영향도 없다. */}
      <img
        ref={imgRef}
        src={src}
        alt={alt ?? ""}
        width={width ?? undefined}
        height={height ?? undefined}
        className="max-w-full rounded-lg block"
        onLoad={onLoad}
        style={{
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
        }}
        draggable={false}
      />
      {selected && (
        <>
          {/* 선택 테두리 */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              border: "2px solid #3b82f6",
              borderRadius: 4,
              pointerEvents: "none",
            }}
          />
          {/* 리사이즈 핸들 8개 — 마우스 드래그 + 방향키(±8px, Shift+±20px) 둘 다 지원 */}
          {HANDLES.map((handle) => (
            <span
              key={handle}
              role="slider"
              tabIndex={0}
              aria-label={`이미지 크기 조절 (${HANDLE_LABELS[handle]})`}
              aria-valuenow={width ?? undefined}
              onMouseDown={(e) => onMouseDown(e, handle)}
              onKeyDown={(e) => onHandleKeyDown(e, handle)}
              style={getHandleStyle(handle)}
            />
          ))}
        </>
      )}
    </NodeViewWrapper>
  );
}
