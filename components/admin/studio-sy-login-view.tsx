"use client";

import { Suspense } from "react";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { AdminRequiredToast } from "@/components/admin-required-toast";
import { SITE_NAME_BASE } from "@/lib/constants";

export function StudioSyLoginView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <Suspense fallback={null}>
        <AdminRequiredToast />
      </Suspense>

      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-[18px] font-medium tracking-[-0.5px]">
          {SITE_NAME_BASE}<span className="blink-cursor">_</span>
        </span>
        <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          ADMIN
        </span>
      </div>

      <p className="text-sm text-muted-foreground">관리자 계정으로 로그인하세요</p>

      <OAuthButtons redirectTo="/studio-sy" />
    </div>
  );
}
