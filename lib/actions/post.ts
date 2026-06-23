"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ApiResponse, PostWithRelations } from "@/types";

// --- Zod 스키마 ---

const getPostsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  publishedOnly: z.boolean().default(true),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  sort: z.enum(["latest", "oldest", "views"]).default("latest"),
});

const createPostSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug는 영소문자, 숫자, 하이픈만 허용"),
  content: z.string().min(1, "내용을 입력해주세요"),
  excerpt: z.string().max(300).optional(),
  coverImage: z.string().url().optional(),
  published: z.boolean().default(false),
  authorId: z.string(),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
});

/**
 * 포스트 목록 조회
 */
export async function getPosts(
  input: Partial<z.infer<typeof getPostsSchema>> = {}
): Promise<ApiResponse<PostWithRelations[]>> {
  const parsed = getPostsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "잘못된 요청 파라미터" };
  }

  const { page, limit, publishedOnly, categorySlug, tagSlug, sort } = parsed.data;

  const orderBy =
    sort === "views"
      ? [{ viewCount: "desc" as const }]
      : sort === "oldest"
        ? [{ publishedAt: { sort: "asc" as const, nulls: "last" as const } }, { createdAt: "asc" as const }]
        : [{ publishedAt: { sort: "desc" as const, nulls: "last" as const } }, { createdAt: "desc" as const }];

  try {
    const posts = await db.post.findMany({
      where: {
        ...(publishedOnly && { published: true }),
        ...(categorySlug && {
          categories: { some: { category: { slug: categorySlug } } },
        }),
        ...(tagSlug && {
          tags: { some: { tag: { slug: tagSlug } } },
        }),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, bio: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { success: true, data: posts as PostWithRelations[] };
  } catch (error) {
    console.error("[getPosts]", error);
    return { success: false, error: "포스트 조회 중 오류가 발생했습니다" };
  }
}

/**
 * slug로 단일 포스트 조회 + 조회수 증가
 */
export async function getPostBySlug(
  slug: string
): Promise<ApiResponse<PostWithRelations>> {
  if (!slug || typeof slug !== "string") {
    return { success: false, error: "올바르지 않은 slug" };
  }

  try {
    const post = await db.post.findFirst({
      where: { slug, published: true },
      include: {
        author: { select: { id: true, name: true, avatar: true, bio: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!post) {
      return { success: false, error: "포스트를 찾을 수 없습니다" };
    }

    // 조회수 비동기 증가 (응답 블로킹 없음)
    db.post
      .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
      .catch((e) => console.error("[viewCount increment]", e));

    return { success: true, data: post as PostWithRelations };
  } catch (error) {
    console.error("[getPostBySlug]", error);
    return { success: false, error: "포스트 조회 중 오류가 발생했습니다" };
  }
}

// ===== 관리자용 액션 =====

const getAdminPostsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  publishedFilter: z.enum(["all", "published", "unpublished"]).default("all"),
  sort: z.enum(["latest", "views", "updatedAt"]).default("latest"),
});

export type AdminPost = {
  id: number;
  title: string;
  slug: string;
  published: boolean;
  viewCount: number;
  updatedAt: Date;
  createdAt: Date;
  publishedAt: Date | null;
  categories: { category: { id: string; name: string; slug: string } }[];
  tags: { tag: { id: string; name: string; slug: string } }[];
};

export type AdminPostsResult = {
  posts: AdminPost[];
  total: number;
  totalPages: number;
};

/**
 * 관리자용 포스트 목록 조회 (미공개 포함)
 */
export async function getAdminPosts(
  input: Partial<z.infer<typeof getAdminPostsSchema>> = {}
): Promise<ApiResponse<AdminPostsResult>> {
  const parsed = getAdminPostsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "잘못된 요청 파라미터" };
  }

  const { page, limit, search, categorySlug, tagSlug, publishedFilter, sort } = parsed.data;

  const where = {
    ...(search && { title: { contains: search, mode: "insensitive" as const } }),
    ...(publishedFilter === "published" && { published: true }),
    ...(publishedFilter === "unpublished" && { published: false }),
    ...(categorySlug && { categories: { some: { category: { slug: categorySlug } } } }),
    ...(tagSlug && { tags: { some: { tag: { slug: tagSlug } } } }),
  };

  const orderBy =
    sort === "views"
      ? [{ viewCount: "desc" as const }]
      : sort === "updatedAt"
        ? [{ updatedAt: "desc" as const }]
        : [{ publishedAt: { sort: "desc" as const, nulls: "last" as const } }, { createdAt: "desc" as const }];

  try {
    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          published: true,
          viewCount: true,
          updatedAt: true,
          createdAt: true,
          publishedAt: true,
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.post.count({ where }),
    ]);

    return {
      success: true,
      data: {
        posts: posts as AdminPost[],
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("[getAdminPosts]", error);
    return { success: false, error: "포스트 조회 중 오류가 발생했습니다" };
  }
}

/**
 * 포스트 통계 조회 (전체/공개/비공개 수)
 */
export async function getPostStats(): Promise<ApiResponse<{ total: number; published: number; unpublished: number }>> {
  try {
    const [total, published] = await Promise.all([
      db.post.count(),
      db.post.count({ where: { published: true } }),
    ]);
    return { success: true, data: { total, published, unpublished: total - published } };
  } catch (error) {
    console.error("[getPostStats]", error);
    return { success: false, error: "통계 조회 중 오류가 발생했습니다" };
  }
}

/**
 * 포스트 삭제
 */
export async function deletePost(id: number): Promise<ApiResponse<null>> {
  try {
    await db.post.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, data: null };
  } catch (error) {
    console.error("[deletePost]", error);
    return { success: false, error: "포스트 삭제 중 오류가 발생했습니다" };
  }
}

/**
 * 포스트 공개/비공개 전환
 */
export async function togglePostPublished(id: number, published: boolean): Promise<ApiResponse<null>> {
  try {
    await db.post.update({
      where: { id },
      data: {
        published,
        publishedAt: published ? new Date() : null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, data: null };
  } catch (error) {
    console.error("[togglePostPublished]", error);
    return { success: false, error: "상태 변경 중 오류가 발생했습니다" };
  }
}

/**
 * 포스트 일괄 작업 (공개/비공개/삭제)
 */
export async function bulkUpdatePosts(
  ids: number[],
  action: "publish" | "unpublish" | "delete"
): Promise<ApiResponse<null>> {
  if (ids.length === 0) return { success: false, error: "선택된 포스트가 없습니다" };

  try {
    if (action === "delete") {
      await db.post.deleteMany({ where: { id: { in: ids } } });
    } else {
      await db.post.updateMany({
        where: { id: { in: ids } },
        data: {
          published: action === "publish",
          publishedAt: action === "publish" ? new Date() : null,
        },
      });
    }
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, data: null };
  } catch (error) {
    console.error("[bulkUpdatePosts]", error);
    return { success: false, error: "일괄 처리 중 오류가 발생했습니다" };
  }
}

/**
 * 포스트 생성
 */
export async function createPost(
  input: z.infer<typeof createPostSchema>
): Promise<ApiResponse<PostWithRelations>> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "검증 실패" };
  }

  const { authorId, categoryIds, tagIds, ...data } = parsed.data;

  try {
    const post = await db.post.create({
      data: {
        ...data,
        publishedAt: data.published ? new Date() : null,
        author: { connect: { id: authorId } },
        categories: {
          create: categoryIds.map((id) => ({ category: { connect: { id } } })),
        },
        tags: {
          create: tagIds.map((id) => ({ tag: { connect: { id } } })),
        },
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, bio: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    return { success: true, data: post as PostWithRelations };
  } catch (error) {
    console.error("[createPost]", error);
    if ((error as { code?: string }).code === "P2002") {
      return { success: false, error: "이미 사용 중인 slug입니다" };
    }
    return { success: false, error: "포스트 생성 중 오류가 발생했습니다" };
  }
}
