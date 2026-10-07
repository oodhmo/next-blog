export const SITE_NAME_BASE = "stdout";
export const SITE_NAME = `${SITE_NAME_BASE}_`;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_DESCRIPTION = "풀스택 개발 경험, 삽질 기록, 그리고 가끔 딴 생각들.";

export const SITE_TAGLINE = "printing thoughts to stdout.";

export const NAV_LINKS = [
  { label: "Posts", href: "/blog" },
  { label: "About", href: "/about" },
] as const;

export const POSTS_PER_PAGE = 10;
