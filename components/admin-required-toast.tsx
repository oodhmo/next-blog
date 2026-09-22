"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// /studio-sy에서 ADMIN 권한 없이 튕겨날 때 붙는 ?error=admin_required 쿼리를 감지해 토스트로 안내한다.
export function AdminRequiredToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("error") !== "admin_required") return;

    toast.error("관리자 권한이 없습니다");

    const params = new URLSearchParams(searchParams);
    params.delete("error");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  return null;
}
