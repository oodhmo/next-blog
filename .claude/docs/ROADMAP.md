# 📝 Admin 새 글 작성 페이지 - ROADMAP

## 0. 기술 결정 사항 (선행 결정)

### 에디터 라이브러리: **Tiptap** 선택

| 후보 | 비교 |
|---|---|
| **Tiptap** ✅ | ProseMirror 기반, TypeScript 1급 지원, Next.js App Router/SSR 호환 좋음, 확장(extension) 단위로 h1/bold/code block/link 등을 딱 필요한 만큼만 추가 가능, JSON(ProseMirror doc) 형태로 직렬화되어 Prisma `Json` 컬럼에 저장하기 적합 |
| Lexical | Meta 작품, 성능은 좋으나 React 통합과 커스텀 노드 작성 난이도가 높고 생태계 문서가 Tiptap보다 부족 |
| Plate | Slate 기반이라 무겁고, 우리 스펙(h1~h3, bold, italic, image 버튼, code block, link)엔 과한 플러그인 구조 |
| Quill | Delta 포맷 저장 방식이 Prisma 스키마와 어울리지 않고, React/Next 15 App Router와의 통합이 상대적으로 구식 |

→ **결론**: `@tiptap/react` + `@tiptap/starter-kit` + 필요한 확장(`Link`, `CodeBlock`, `Image`는 버튼만)

### 저장 방식
- Tiptap의 `editor.getJSON()` 결과(ProseMirror JSON)를 **그대로** `Post.content` (Prisma `Json` 타입)에 저장
- HTML 변환(`getHTML()`)은 표시용으로만 필요시 사용, 원본 저장은 JSON 권장 (재편집 시 손실 없음)

### 기타 라이브러리
- 캘린더: `react-day-picker` + `Popover` (shadcn/ui 스타일) — 폼 클릭 시 캘린더 표시
- Toast: `sonner` (Next.js 15와 호환 좋고 설치/사용 간단)

---

## 1단계: Tiptap 에디터 기본 셋업

**목표**: 에디터가 페이지에 렌더링되고 타이핑이 가능한 상태

- [ ] `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` 설치
- [ ] `@tiptap/extension-link` 설치
- [ ] `useEditor` 훅으로 기본 에디터 컴포넌트 작성 (`components/admin/PostEditor.tsx`)
- [ ] StarterKit에서 사용할 노드만 선택 활성화: Heading(level: 1~3), Bold, Italic, CodeBlock
- [ ] `#`, `##`, `###` 입력 시 즉시 h1/h2/h3로 변환되는지 확인 (StarterKit 기본 동작)
- [ ] 클라이언트 컴포넌트(`'use client'`)로 분리, SSR hydration 이슈 없는지 확인



---

## 2단계: 툴바 UI 구현

**목표**: 버튼으로 서식 적용 가능, 이미지 버튼은 placeholder

- [ ] 툴바 컴포넌트 작성 (`components/admin/EditorToolbar.tsx`)
- [ ] 버튼: H1, H2, H3, Bold, Italic, Code Block, Link, Image
- [ ] 각 버튼 클릭 시 `editor.chain().focus().toggleXXX().run()` 패턴 적용
- [ ] Link 버튼: 클릭 시 간단한 URL 입력 prompt 또는 인라인 입력 UI → `setLink` 적용
- [ ] Image 버튼: **클릭 핸들러 없이 버튼만 렌더링** (업로드 기능은 추후 단계, TODO 주석 남기기)
- [ ] 현재 커서 위치 기준 활성 상태(active state) 표시 (예: bold 적용 중이면 버튼 강조)

> Claude Code 프롬프트 예시: "EditorToolbar 컴포넌트를 만들어줘. h1/h2/h3/bold/italic/codeBlock/link 버튼은 동작하게, image 버튼은 disabled 없이 보이기만 하고 onClick은 TODO 주석만 남겨줘. 현재 활성화된 서식은 버튼에 active 스타일 적용."

---

## 3단계: 글 작성 폼 레이아웃 (제목/요약/태그/발행일/상태)

**목표**: 에디터 외 모든 메타데이터 입력 UI 완성

- [ ] 제목 입력 필드 (텍스트 input)
- [ ] Excerpt(요약) 입력 필드 (textarea)
- [ ] 태그 입력 UI
  - [ ] 텍스트 input + Enter keydown 핸들러
  - [ ] Enter 시 태그를 배열 state에 추가하고, 폼 상단에 `sonner` toast로 "태그 추가됨: {tag}" 표시
  - [ ] 추가된 태그는 chip/badge 형태로 입력창 아래 나열, 클릭 시 제거 가능하게 (선택 개선사항)
- [ ] 발행일 선택 섹션
  - [ ] 날짜 표시용 버튼/입력 클릭 시 `Popover` + `react-day-picker` 캘린더 오픈
  - [ ] 선택한 날짜를 폼 state(`publishedAt`)에 저장
- [ ] 카테고리 선택 섹션
  - [ ] Prisma 스키마에 `Category` 모델 존재 여부 확인 (없으면 마이그레이션 선행: `Category { id, name, slug }`, `Post`와 1:N 관계로 설계 — 태그는 N:M, 카테고리는 보통 글 하나당 하나이므로 1:N이 일반적)
  - [ ] 카테고리 목록은 서버에서 미리 조회(`getCategories`)해서 Select/Dropdown으로 표시 (shadcn/ui `Select` 권장)
  - [ ] 선택값을 폼 state(`categoryId`)에 저장
  - [ ] 카테고리가 아직 없는 경우 "새 카테고리 추가" 옵션을 둘지 여부는 범위 외로 두고, 우선 기존 목록에서 선택만 가능하게 구현 (필요 시 별도 단계로 분리)
- [ ] 상태 선택: Draft / Published 토글 버튼 또는 세그먼트 컨트롤
  - [ ] 저장 시 이 상태값이 Prisma `Post.status` (또는 해당 필드)에 매핑되도록 처리

> Claude Code 프롬프트 예시: "PostForm 컴포넌트에 제목 input, excerpt textarea, 태그 입력(Enter 시 sonner toast + 배열 추가), react-day-picker 기반 발행일 Popover 캘린더, 카테고리 Select(서버에서 가져온 목록 표시), Draft/Published 토글 버튼을 추가해줘."

---

## 4단계: 통계 섹션 (단어수 / 글자수 / �읅기 시간)

**목표**: 에디터 내용이 바뀔 때마다 실시간으로 통계 갱신

- [ ] 에디터의 plain text 추출: `editor.getText()` 사용
- [ ] **글자수 계산**
  - [ ] 한글: 음절(글자) 단위로 카운트 (공백 제외 또는 포함 기준 정의)
  - [ ] 영어: 알파벳 문자 단위로 카운트
  - [ ] 혼용 텍스트 대응: 정규식으로 한글/영어 구간을 구분해서 각각 합산하거나, 전체 글자수(공백 제외) 하나로 통일할지 결정 필요 → **권장**: 화면엔 "글자수(공백 포함/제외)" 하나만 표시하되, 내부적으로 한글은 글자 단위, 영어는 word 단위 카운트 로직을 분리해서 정확도 확보
- [ ] **단어수 계산**
  - [ ] 영어: 공백 기준 split
  - [ ] 한글: 띄어쓰기 기준 어절 카운트 (한글은 "단어"보다 "어절" 개념이 더 정확함을 주석으로 명시)
- [ ] **읽기 시간**: `Math.ceil(글자수 / 500)` 분 단위로 계산, 화면엔 "약 N분" 표시
- [ ] `editor.on('update', ...)` 또는 `useEditorState`로 실시간 반영 (디바운스 불필요할 정도로 가벼운 연산이므로 매 업데이트마다 재계산해도 무방, 다만 성능 이슈 시 `useMemo` 적용)

> Claude Code 프롬프트 예시: "에디터 내용이 바뀔 때마다 한글/영어 글자수, 단어수(한글은 어절 기준, 영어는 공백 split), 읽기 시간(Math.ceil(글자수/500)분)을 계산해서 보여주는 StatsBar 컴포넌트를 만들어줘. 정규식으로 한글 유니코드 범위(가-힣)와 영문자를 구분해줘."

---

## 5단계: 저장 로직 (Server Action 연동)

**목표**: Draft/Published 버튼으로 실제 DB에 저장

- [ ] Server Action 작성 (`actions/post.ts` 또는 기존 구조에 맞춰): `createPost(formData)`
- [ ] 저장 payload 구성: `title`, `excerpt`, `content`(Tiptap JSON), `tags`, `categoryId`, `status`(draft/published), `publishedAt`
- [ ] Prisma `Post` 모델에 `content: Json`, `status: PostStatus`(enum), `categoryId`(FK) 필드 존재 여부 확인 → 없으면 스키마 마이그레이션 선행
- [ ] 태그는 기존 `Tag` 모델과 연결(다대다 관계라면 `connectOrCreate` 활용)
- [ ] 카테고리는 `connect: { id: categoryId }`로 단일 관계 연결 (선택 안 했을 경우 null 허용 여부 결정)
- [ ] 저장 버튼(Draft 저장 / Published 발행) 각각 다른 status 값으로 같은 Server Action 호출
- [ ] 저장 성공/실패 시 `sonner` toast로 피드백

> Claude Code 프롬프트 예시: "Tiptap JSON content를 받아 Prisma Post 모델에 저장하는 createPost Server Action을 작성해줘. 태그는 connectOrCreate로 처리하고, 카테고리는 categoryId로 connect 처리하고, status는 draft/published 두 값을 받아 분기 처리해줘."

---

## 6단계: 통합 및 마무리

- [ ] 전체 폼 → 에디터 → 통계 → 저장까지 end-to-end 동작 확인
- [ ] Draft 저장 후 다시 불러왔을 때 Tiptap JSON이 정상적으로 `editor.commands.setContent()`로 복원되는지 확인
- [ ] 발행일이 미래 날짜일 경우 status가 Published라도 노출되는지 확인
- [ ] 반응형/접근성 기본 점검

---

## 참고: 세션 간 컨텍스트 유지
기존 패턴대로 각 단계 완료 시 `CONTEXT.md`에 다음을 기록 권장:
- 이번 단계에서 결정한 사항 (예: 글자수 계산 기준)
- 다음 단계에서 참조해야 할 파일 경로
- 미해결 TODO (예: 이미지 업로드 기능은 별도 로드맵으로 분리)