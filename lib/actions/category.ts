"use server";

import { db } from "@/lib/db";

export async function getCategories(): Promise<string[]> {
  const categories = await db.category.findMany({
    where: { posts: { some: { post: { published: true } } } },
    orderBy: { id: "asc" },
    select: { name: true },
  });
  return categories.map((c) => c.name);
}
