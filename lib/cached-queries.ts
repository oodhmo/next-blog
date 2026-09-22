import { cache } from "react";
import { getPostBySlug, getPostById } from "@/lib/actions/post";

// generateMetadata와 페이지 컴포넌트가 같은 요청 안에서 동일한 포스트를
// 중복 조회(+ viewCount 이중 증가)하는 것을 막기 위한 요청 단위 캐시.
// "use server" 파일(lib/actions/post.ts)의 export를 직접 cache()로 감싸면
// 서버 액션 변환과 충돌할 수 있어, 별도의 일반 모듈에서 감싼다.
export const getPostBySlugCached = cache(getPostBySlug);
export const getPostByIdCached = cache(getPostById);
