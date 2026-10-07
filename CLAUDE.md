# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 및 커뮤니케이션 규칙

- **기본 응답 언어**: 한국어
- **코드 주석**: 한국어로 작성
- **커밋 메시지**: 한국어로 작성
- **문서화**: 한국어로 작성
- **변수명/함수명**: 영어 (코드 표준 준수)

## 개요

Next.js v15 App Router + React 19 + TypeScript v5 + TailwindCSS v4 기반 블로그 프로젝트.  
인접한 `../next-starterkit`을 기반 스타터킷으로 참조할 수 있다.

## 명령어

```bash
npm run dev       # 개발 서버 (Turbopack)
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 서버 실행
npm run lint      # ESLint 검사

# shadcn/ui 컴포넌트 추가
npx shadcn@latest add <component-name>
```

## 예상 아키텍처

```
app/                      # Next.js App Router
  layout.tsx              # 루트 레이아웃
  page.tsx                # 홈(블로그 목록)
  blog/[slug]/page.tsx    # 개별 포스트 페이지
  globals.css             # TailwindCSS v4 테마 토큰
components/
  ui/                     # shadcn/ui 컴포넌트
lib/
  utils.ts                # 유틸리티 함수
  posts.ts                # 포스트 데이터 로딩 로직
types/
  index.ts                # 공통 타입 정의
content/                  # MDX 또는 마크다운 포스트 파일
```

## TailwindCSS v4 핵심 사항

`tailwind.config` 파일 **없음**. 모든 테마 토큰은 `app/globals.css`의 `@theme inline` 블록에서 관리.

- 색상 토큰: `:root`와 `.dark`에 **oklch** 함수로 CSS 변수 정의
- 다크모드: `@custom-variant dark (&:is(.dark *))` — `.dark` 클래스 기반
- 새 토큰 추가 시 `@theme inline` 블록에 `--color-*` 형태로 추가

## shadcn/ui 설정

`components.json` 기준 (초기화 시 설정):
- 스타일: `new-york`, CSS 변수 사용, 아이콘: `lucide-react`
- `components/ui/` 컴포넌트는 직접 수정 가능

## 경로 별칭

`@/*` → 프로젝트 루트 (`./`)

## 환경 변수

`.env.local` 파일 사용. 주요 변수:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

사이트 이름은 환경 변수가 아닌 `lib/constants.ts`의 `SITE_NAME_BASE`에서 관리한다. 하드코딩하지 말고 `SITE_NAME`(메타데이터, 텍스트) 또는 `SITE_NAME_BASE`(커서가 붙는 로고)를 사용한다.
