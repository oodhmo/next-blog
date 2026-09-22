import { auth } from "@/auth";
import type { Session } from "next-auth";

// 서버 액션(mutation) 진입점에서 공통으로 쓰는 인증/인가 가드.
// 실패 시 { ok: false, error } 형태로 반환하므로 각 액션에서
// `if (!guard.ok) return { success: false, error: guard.error }` 패턴으로 바로 이어붙일 수 있다.
//
// 참고: `auth`는 next-auth v5에서 미들웨어(request,event)/서버(무인자) 두 오버로드를
// 함께 노출하므로 `ReturnType<typeof auth>`로 세션 타입을 추론하면 잘못된 오버로드가 선택된다.
// 그래서 `next-auth`의 `Session` 타입(types/next-auth.d.ts로 확장됨)을 직접 사용한다.

export type AuthGuardResult =
  | { ok: true; session: Session }
  | { ok: false; error: string };

/** 로그인만 확인 (역할 무관) */
export async function requireUser(): Promise<AuthGuardResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "로그인이 필요합니다" };
  }
  return { ok: true, session };
}

/** 로그인 + ADMIN 역할 확인. 관리자 전용 mutation/조회에 사용 */
export async function requireAdmin(): Promise<AuthGuardResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "로그인이 필요합니다" };
  }
  if (session.user.role !== "ADMIN") {
    return { ok: false, error: "관리자 권한이 필요합니다" };
  }
  return { ok: true, session };
}
