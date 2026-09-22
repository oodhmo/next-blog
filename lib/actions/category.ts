"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import type { ApiResponse } from "@/types";

export type AdminTag = {
  id: number;
  name: string;
  slug: string;
  _count: { posts: number };
};

export async function getAllTags(): Promise<ApiResponse<AdminTag[]>> {
  try {
    const tags = await db.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
    });
    return { success: true, data: tags };
  } catch (error) {
    console.error("[getAllTags]", error);
    return { success: false, error: "태그 조회 중 오류가 발생했습니다" };
  }
}

export async function getCategories(): Promise<{ name: string; slug: string }[]> {
  try {
    const categories = await db.category.findMany({
      where: { posts: { some: { post: { published: true } } } },
      orderBy: { id: "asc" },
      select: { name: true, slug: true },
    });
    return categories;
  } catch (error) {
    console.error("[getCategories]", error);
    return [];
  }
}

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  _count: { posts: number };
};

/**
 * 전체 카테고리 목록 조회 (포스트 수 포함)
 */
export async function getAllCategories(): Promise<ApiResponse<AdminCategory[]>> {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("[getAllCategories]", error);
    return { success: false, error: "카테고리 조회 중 오류가 발생했습니다" };
  }
}

/**
 * 카테고리 생성
 */
export async function createCategory(name: string, slug: string): Promise<ApiResponse<AdminCategory>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!name.trim() || !slug.trim()) {
    return { success: false, error: "이름과 슬러그를 입력해주세요" };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: "슬러그는 영소문자, 숫자, 하이픈만 허용합니다" };
  }

  try {
    const category = await db.category.create({
      data: { name: name.trim(), slug: slug.trim() },
      include: { _count: { select: { posts: true } } },
    });
    revalidatePath("/studio-sy");
    revalidatePath("/");
    revalidatePath("/blog");
    return { success: true, data: category };
  } catch (error) {
    console.error("[createCategory]", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "이미 사용 중인 슬러그입니다" };
    }
    return { success: false, error: "카테고리 생성 중 오류가 발생했습니다" };
  }
}

/**
 * 카테고리 수정
 */
export async function updateCategory(id: number, name: string, slug: string): Promise<ApiResponse<AdminCategory>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!name.trim() || !slug.trim()) {
    return { success: false, error: "이름과 슬러그를 입력해주세요" };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: "슬러그는 영소문자, 숫자, 하이픈만 허용합니다" };
  }

  try {
    const category = await db.category.update({
      where: { id },
      data: { name: name.trim(), slug: slug.trim() },
      include: { _count: { select: { posts: true } } },
    });
    revalidatePath("/studio-sy");
    revalidatePath("/");
    revalidatePath("/blog");
    return { success: true, data: category };
  } catch (error) {
    console.error("[updateCategory]", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "이미 사용 중인 슬러그입니다" };
    }
    return { success: false, error: "카테고리 수정 중 오류가 발생했습니다" };
  }
}

/**
 * 카테고리 삭제
 */
export async function deleteCategory(id: number): Promise<ApiResponse<null>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  try {
    await db.category.delete({ where: { id } });
    revalidatePath("/studio-sy");
    revalidatePath("/");
    revalidatePath("/blog");
    return { success: true, data: null };
  } catch (error) {
    console.error("[deleteCategory]", error);
    return { success: false, error: "카테고리 삭제 중 오류가 발생했습니다" };
  }
}
