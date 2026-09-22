"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateSlug, estimateReadTime } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth-guard";
import type { ApiResponse, PostWithRelations } from "@/types";

// 태그 이름 배열 → find-or-create → id 배열. saveEditorPost/updateEditorPost가 공유한다.
// (export하지 않는 내부 헬퍼: "use server" 파일의 export는 전부 서버 액션으로 취급되므로
// 일반 유틸 함수는 여기서 module-private으로만 둔다.)
async function upsertTagsByName(tagNames: string[]): Promise<number[]> {
  const tagIds: number[] = [];
  for (const name of tagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const slug = generateSlug(trimmed) || trimmed.toLowerCase();
    const tag = await db.tag.upsert({
      where: { slug },
      create: { name: trimmed, slug },
      update: {},
    });
    tagIds.push(tag.id);
  }
  return tagIds;
}

// --- Zod 스키마 ---

const getPostsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  publishedOnly: z.boolean().default(true),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  search: z.string().optional(),
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
  categoryIds: z.array(z.number()).default([]),
  tagIds: z.array(z.number()).default([]),
});

/**
 * 포스트 목록 조회
 */
export type PostsResult = {
  posts: PostWithRelations[];
  hasMore: boolean;
};

export async function getPosts(
  input: Partial<z.infer<typeof getPostsSchema>> = {}
): Promise<ApiResponse<PostsResult>> {
  const parsed = getPostsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "잘못된 요청 파라미터" };
  }

  const { page, limit, publishedOnly, categorySlug, tagSlug, search, sort } = parsed.data;

  // publishedOnly=false(미공개 글 포함 조회)는 관리자만 허용한다.
  // 클라이언트가 이 파라미터를 직접 넘길 수 있으므로, 세션이 ADMIN이 아니면 무조건 공개글만 조회한다.
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const effectivePublishedOnly = isAdmin ? publishedOnly : true;

  const orderBy =
    sort === "views"
      ? [{ viewCount: "desc" as const }]
      : sort === "oldest"
        ? [{ publishedAt: { sort: "asc" as const, nulls: "last" as const } }, { createdAt: "asc" as const }]
        : [{ publishedAt: { sort: "desc" as const, nulls: "last" as const } }, { createdAt: "desc" as const }];

  try {
    const posts = await db.post.findMany({
      where: {
        ...(effectivePublishedOnly && { published: true }),
        ...(categorySlug && {
          categories: { some: { category: { slug: categorySlug } } },
        }),
        ...(tagSlug && {
          tags: { some: { tag: { slug: tagSlug } } },
        }),
        ...(search && { title: { contains: search, mode: "insensitive" as const } }),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, bio: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit + 1,
    });

    const hasMore = posts.length > limit;
    const slicedPosts = hasMore ? posts.slice(0, limit) : posts;

    // 목록 카드에는 읽기 시간만 필요하고 본문 전체는 필요 없다. 여기서 미리
    // 계산해두고 content는 비워서 클라이언트(브라우저)로 본문 HTML 전체가
    // 매번 실려가지 않게 한다. (DB에서는 read time 계산을 위해 여전히
    // content를 조회하지만, 응답에는 포함하지 않는다 — 컬럼에 캐싱하려면
    // 스키마 마이그레이션이 필요해 이번 범위에서는 응답 단계에서만 줄인다.)
    const postsForClient = slicedPosts.map((post) => ({
      ...post,
      readTime: estimateReadTime(post.content),
      content: "",
    }));

    return {
      success: true,
      data: { posts: postsForClient as PostWithRelations[], hasMore },
    };
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

    // 조회수 비동기 증가 (응답 블로킹 없음).
    // 단순 fire-and-forget promise는 서버리스 환경에서 함수가 응답 직후
    // 종료되면 중간에 취소될 수 있어, 응답 전송 후에도 실행이 보장되는
    // Next.js의 after()로 스케줄링한다.
    after(() =>
      db.post
        .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
        .catch((e) => console.error("[viewCount increment]", e))
    );

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
  categories: { category: { id: number; name: string; slug: string } }[];
  tags: { tag: { id: number; name: string; slug: string } }[];
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
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

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
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

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
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  try {
    const post = await db.post.delete({ where: { id }, select: { slug: true } });
    revalidatePath("/studio-sy");
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
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
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  try {
    const post = await db.post.update({
      where: { id },
      data: {
        published,
        publishedAt: published ? new Date() : null,
      },
      select: { slug: true },
    });
    revalidatePath("/studio-sy");
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
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
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (ids.length === 0) return { success: false, error: "선택된 포스트가 없습니다" };

  try {
    const targets = await db.post.findMany({
      where: { id: { in: ids } },
      select: { slug: true },
    });

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
    revalidatePath("/studio-sy");
    revalidatePath("/");
    revalidatePath("/blog");
    for (const { slug } of targets) revalidatePath(`/blog/${slug}`);
    return { success: true, data: null };
  } catch (error) {
    console.error("[bulkUpdatePosts]", error);
    return { success: false, error: "일괄 처리 중 오류가 발생했습니다" };
  }
}

/**
 * ID로 단일 포스트 조회 (관계 포함, 관리자용)
 */
export async function getPostById(id: number): Promise<ApiResponse<PostWithRelations>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  try {
    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true, bio: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    if (!post) return { success: false, error: "포스트를 찾을 수 없습니다" };
    return { success: true, data: post as PostWithRelations };
  } catch (error) {
    console.error("[getPostById]", error);
    return { success: false, error: "포스트 조회 중 오류가 발생했습니다" };
  }
}

/**
 * 에디터 페이지에서 포스트 수정
 */
export async function updateEditorPost(
  postId: number,
  input: {
    title: string;
    content: string;
    excerpt?: string;
    tagNames: string[];
    categoryId: string;
    published: boolean;
    publishedAt?: Date;
  }
): Promise<ApiResponse<{ id: number; slug: string }>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const { title, content, excerpt, tagNames, categoryId, published, publishedAt } = input;

  if (!title.trim()) return { success: false, error: "제목을 입력해주세요" };
  if (!content.trim() || content === "<p></p>") return { success: false, error: "내용을 입력해주세요" };

  try {
    const tagIds = await upsertTagsByName(tagNames);
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : null;

    // 카테고리/태그 관계 교체 + 본문 업데이트를 하나의 트랜잭션으로 묶어
    // 중간에 실패해도 관계가 삭제된 채로 남지 않도록 한다.
    const post = await db.$transaction(async (tx) => {
      await tx.categoryOnPost.deleteMany({ where: { postId } });
      await tx.tagOnPost.deleteMany({ where: { postId } });

      if (categoryIdNum) {
        await tx.categoryOnPost.create({ data: { postId, categoryId: categoryIdNum } });
      }
      if (tagIds.length > 0) {
        await tx.tagOnPost.createMany({
          data: tagIds.map((tagId) => ({ postId, tagId })),
        });
      }

      return tx.post.update({
        where: { id: postId },
        data: {
          title: title.trim(),
          content,
          excerpt: excerpt?.trim() || null,
          published,
          publishedAt: published ? (publishedAt ?? new Date()) : null,
        },
        select: { id: true, slug: true },
      });
    });

    revalidatePath("/studio-sy");
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    return { success: true, data: { id: post.id, slug: post.slug } };
  } catch (error) {
    console.error("[updateEditorPost]", error);
    return { success: false, error: "포스트 수정 중 오류가 발생했습니다" };
  }
}

/**
 * 에디터 페이지에서 포스트 저장 (태그 이름으로 find-or-create, HTML content)
 */
export async function saveEditorPost(input: {
  title: string;
  content: string;
  excerpt?: string;
  tagNames: string[];
  categoryId: string;
  published: boolean;
  publishedAt?: Date;
}): Promise<ApiResponse<{ id: number; slug: string }>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const { session } = guard;

  if (!session.user.email) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { title, content, excerpt, tagNames, categoryId, published, publishedAt } = input;

  if (!title.trim()) return { success: false, error: "제목을 입력해주세요" };
  if (!content.trim() || content === "<p></p>") return { success: false, error: "내용을 입력해주세요" };

  try {
    const author = await db.author.findUnique({ where: { email: session.user.email } });
    if (!author) {
      return { success: false, error: "작성자 정보를 찾을 수 없습니다. 관리자에게 문의하세요." };
    }

    const tagIds = await upsertTagsByName(tagNames);
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : null;
    const baseSlug = generateSlug(title) || "untitled";

    // slug 생성 (중복 시 숫자 접미사).
    // 기존에는 findUnique로 미리 빈 slug를 찾은 뒤 create했는데, 그 사이에
    // 다른 요청이 같은 slug를 먼저 만들면 여전히 충돌할 수 있었다(TOCTOU).
    // 대신 create를 시도하다가 P2002(unique 충돌)를 만나면 접미사를 올려
    // 재시도하는 방식으로 바꿔 그 경쟁 상태를 구조적으로 없앤다.
    let post: { id: number; slug: string } | null = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
      try {
        post = await db.post.create({
          data: {
            title: title.trim(),
            slug,
            content,
            excerpt: excerpt?.trim() || null,
            published,
            publishedAt: published ? (publishedAt ?? new Date()) : null,
            author: { connect: { id: author.id } },
            ...(categoryIdNum && {
              categories: { create: [{ category: { connect: { id: categoryIdNum } } }] },
            }),
            ...(tagIds.length > 0 && {
              tags: { create: tagIds.map((id) => ({ tag: { connect: { id } } })) },
            }),
          },
          select: { id: true, slug: true },
        });
        break;
      } catch (error) {
        const isSlugConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
        if (!isSlugConflict) throw error;
        // 다음 attempt에서 접미사를 올려 재시도
      }
    }

    if (!post) {
      return { success: false, error: "이미 사용 중인 slug입니다. 제목을 조금 바꿔보세요." };
    }

    revalidatePath("/studio-sy");
    revalidatePath("/");
    revalidatePath("/blog");
    return { success: true, data: { id: post.id, slug: post.slug } };
  } catch (error) {
    console.error("[saveEditorPost]", error);
    return { success: false, error: "포스트 저장 중 오류가 발생했습니다" };
  }
}

/**
 * 포스트 생성
 */
export async function createPost(
  input: z.infer<typeof createPostSchema>
): Promise<ApiResponse<PostWithRelations>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "이미 사용 중인 slug입니다" };
    }
    return { success: false, error: "포스트 생성 중 오류가 발생했습니다" };
  }
}
