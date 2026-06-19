export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "dvlog_";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_DESCRIPTION = "프론트엔드 개발 경험, 삽질 기록, 그리고 가끔 딴 생각들.";

export const HERO_LABEL = "FRONTEND DEVELOPER · SEOUL, KR";
export const HERO_HEADING = "코드와 디자인 사이,\n그 경계에서 쓰는 글.";
export const HERO_DESCRIPTION = "프론트엔드 개발 경험, 삽질 기록, 그리고 가끔 딴 생각들.";

export const NAV_LINKS = [
  { label: "Posts", href: "/blog" },
  { label: "About", href: "/about" },
] as const;

export const POSTS_PER_PAGE = 10;
export const POSTS_PER_HOME = 50;
