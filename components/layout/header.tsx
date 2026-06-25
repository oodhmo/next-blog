"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const isBlogPost = /^\/blog\/.+/.test(pathname);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isBlogPost) {
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
  }, [isBlogPost]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/86 backdrop-blur-xl">
      <div className="relative page-container flex h-[62px] items-center justify-between">
        {/* 로고 — dvlog_ (커서 깜빡임) */}
        <Link
          href="/"
          className="font-mono text-[18px] font-medium tracking-[-0.5px] transition-opacity hover:opacity-60"
        >
          dvlog<span className="blink-cursor">_</span>
        </Link>

        {/* 헤더 중앙 진행바 — 포스트 페이지에서만 표시 */}
        {isBlogPost && (
          <div className="absolute left-1/2 -translate-x-1/2 flex w-[220px] items-center gap-2.5 overflow-hidden rounded-full border border-border/50 px-3.5 py-[5px]">
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
        )}

        {/* 네비게이션 + 테마 토글 */}
        <div className="flex items-center gap-0.5">
          <nav className="hidden items-center md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-[13px] py-[7px] text-[13.5px] font-medium transition-colors",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
