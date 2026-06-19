import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const createPostSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug는 영소문자, 숫자, 하이픈만 허용"),
  content: z.string().min(1, "내용을 입력해주세요"),
  excerpt: z.string().optional(),
  coverImage: z.string().url().optional(),
  published: z.boolean().default(false),
  authorId: z.string(),
});

// GET /api/posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);
    const publishedOnly = searchParams.get("published") !== "false";

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where: publishedOnly ? { published: true } : {},
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
        orderBy: [
          { publishedAt: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.post.count({ where: publishedOnly ? { published: true } : {} }),
    ]);

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return NextResponse.json(
      { success: false, error: "포스트 조회 실패" },
      { status: 500 }
    );
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { authorId, ...data } = parsed.data;
    const post = await db.post.create({
      data: {
        ...data,
        publishedAt: data.published ? new Date() : null,
        author: { connect: { id: authorId } },
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/posts]", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 slug입니다" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "포스트 생성 실패" },
      { status: 500 }
    );
  }
}
