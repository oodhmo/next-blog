import type { ReactNode } from "react";
import type {
  Post,
  Author,
  Category,
  Tag,
  CategoryOnPost,
  TagOnPost,
} from "@prisma/client";

// ===== 공통 타입 =====

export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type Theme = "light" | "dark" | "system";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type PaginationParams = {
  page: number;
  limit: number;
};

export type SortDirection = "asc" | "desc";

export type PostSortKey = "latest" | "oldest" | "views";

export type WithChildren<T = object> = T & {
  children: ReactNode;
};

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
