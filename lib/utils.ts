import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// TailwindCSS 클래스 병합 (충돌 해결 포함)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 날짜 포맷팅 (예: 2024년 1월 15일)
export function formatDate(date: Date | string, locale = "ko-KR"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

// 날짜 포맷팅 (예: 2026.06.10)
export function formatDateSimple(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// 조회수 포맷 (예: 5800 → 5.8k)
export function formatViewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

// 읽기 시간 추정 (분)
export function estimateReadTime(content: string, wordsPerMinute = 200): number {
  const plainText = content.replace(/<[^>]*>/g, " ");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// slug 생성
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[가-힣]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, ""); // 한글만 앞/뒤에 있던 경우 공백이 하이픈으로 남는 것 제거 (예: "안녕 Hello" → "-hello" 방지)
}

// sort 쿼리 파라미터 파싱 및 검증
import type { PostSortKey } from "@/types";
const VALID_SORT_KEYS = ["latest", "oldest", "views"] as const satisfies readonly PostSortKey[];
export function parsePostSort(sort: string | undefined): PostSortKey {
  return (VALID_SORT_KEYS as readonly string[]).includes(sort ?? "")
    ? (sort as PostSortKey)
    : "latest";
}
