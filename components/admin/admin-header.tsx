import Link from "next/link";
import { Plus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/86 backdrop-blur-xl">
      <div className="mx-auto flex h-[62px] max-w-[1200px] items-center justify-between px-6">
        {/* 좌측: 로고 + ADMIN 태그 */}
        <div className="flex items-center gap-3">
          <Link
            href="/studio-sy"
            className="font-mono text-[18px] font-medium tracking-[-0.5px] transition-opacity hover:opacity-60"
          >
            sylog<span className="blink-cursor">_</span>
          </Link>
          <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            ADMIN
          </span>
        </div>

        {/* 우측: 새 글 작성 버튼 + 다크모드 토글 */}
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gap-2 px-4">
            <Link href="/studio-sy/editor">
              <Plus className="h-4 w-4" />
              새 포스트
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
