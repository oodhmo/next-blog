import type {
  Post,
  Author,
  Category,
  Tag,
  CategoryOnPost,
  TagOnPost,
} from "@prisma/client";

// ===== 공통 타입 =====

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type PostSortKey = "latest" | "oldest" | "views";

// ===== Prisma 확장 타입 =====

export type CategoryOnPostWithCategory = CategoryOnPost & {
  category: Category;
};

export type TagOnPostWithTag = TagOnPost & {
  tag: Tag;
};

export type PostWithRelations = Post & {
  author: Pick<Author, "id" | "name" | "avatar" | "bio">;
  categories: CategoryOnPostWithCategory[];
  tags: TagOnPostWithTag[];
  // 목록(getPosts) 조회 시에는 본문 전체를 클라이언트로 보내지 않기 위해
  // 서버에서 미리 계산한 읽기 시간만 채우고 content는 빈 문자열로 둔다.
  // 상세 조회(getPostBySlug/getPostById)에서는 채우지 않는다(undefined).
  readTime?: number;
};

export type CommentWithUser = {
  id: number;
  content: string;
  postId: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  user: { id: string; name: string | null; image: string | null };
};
