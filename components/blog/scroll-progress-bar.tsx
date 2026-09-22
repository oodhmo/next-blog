"use client";

import { useEffect, useState } from "react";

type ScrollProgressBarProps = {
  active: boolean;
};

// 헤더 중앙의 스크롤 진행률 표시 바.
// 스크롤할 때마다 상태가 바뀌는 부분을 Header에서 이 leaf 컴포넌트로 분리해,
// 스크롤 이벤트가 Header 전체(로고/네비/ThemeToggle)를 리렌더시키지 않도록 한다.
export function ScrollProgressBar({ active }: ScrollProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex w-[220px] items-center gap-2.5 overflow-hidden rounded-full border border-border/50 px-3.5 py-[5px]"
      role="progressbar"
      aria-label="읽기 진행률"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* 진행도 배경 채우기 */}
      <div
        className="absolute left-0 top-0 h-full bg-foreground/[0.12] dark:bg-white/20"
        style={{ width: `${progress}%` }}
      />
      <span className="relative z-10 shrink-0 font-mono text-[10.5px] text-muted-foreground/60 tracking-wide">
        Progress ...
      </span>
      <div className="relative z-10 flex-1 h-px bg-border/70" />
    </div>
  );
}
