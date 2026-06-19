"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/86 backdrop-blur-xl">
      <div className="page-container flex h-[62px] items-center justify-between">
        {/* 로고 — dvlog_ (커서 깜빡임) */}
        <Link
          href="/"
          className="font-mono text-[18px] font-medium tracking-[-0.5px] transition-opacity hover:opacity-60"
        >
          dvlog<span className="blink-cursor">_</span>
        </Link>

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
