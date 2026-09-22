# next-blog 검증 스킬

## 실행
```bash
npm run dev   # Turbopack, 포트 3000
```
기존 프로세스가 있으면 먼저 종료:
```bash
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## 주요 확인 경로
- `http://localhost:3000/` — 메인 페이지 (포스트 리스트, 필터바, 정렬)
- `http://localhost:3000/blog` — 블로그 목록 페이지
- `http://localhost:3000/blog?sort=views` — 정렬 파라미터
- `http://localhost:3000/?sort=invalid` — 잘못된 파라미터 → 기본값 latest

## 주요 컴포넌트
- PostList (클라이언트): 무한 스크롤, 카테고리 필터, 검색
- PostFilterBar: 필터 UI (PostList에서 분리)
- CategoryBadge: 카테고리 색상 배지 (PostCard, FeaturedPostCard 공유)
- FeaturedPostCard: 첫 번째 포스트 (배지: Latest/Most Viewed/Oldest)
