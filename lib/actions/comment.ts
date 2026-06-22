"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import type { ApiResponse, CommentWithUser } from "@/types"

const createCommentSchema = z.object({
  postId: z.number().int().positive(),
  content: z.string().min(1, "댓글 내용을 입력해주세요").max(1000, "댓글은 1000자 이내로 작성해주세요"),
})

export async function getComments(postId: number): Promise<ApiResponse<CommentWithUser[]>> {
  try {
    const comments = await db.comment.findMany({
      where: { postId, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    return { success: true, data: comments as CommentWithUser[] }
  } catch (error) {
    console.error("[getComments]", error)
    return { success: false, error: "댓글 조회 중 오류가 발생했습니다" }
  }
}

export async function createComment(
  input: z.infer<typeof createCommentSchema>
): Promise<ApiResponse<CommentWithUser>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다" }
  }

  const parsed = createCommentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "검증 실패" }
  }

  const { postId, content } = parsed.data

  try {
    const comment = await db.comment.create({
      data: {
        content,
        postId,
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    })

    return { success: true, data: comment as CommentWithUser }
  } catch (error) {
    console.error("[createComment]", error)
    return { success: false, error: "댓글 작성 중 오류가 발생했습니다" }
  }
}

export async function deleteComment(commentId: number): Promise<ApiResponse<{ id: number }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다" }
  }

  try {
    const comment = await db.comment.findUnique({ where: { id: commentId } })
    if (!comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다" }
    }

    const isOwner = comment.userId === session.user.id
    const isAdmin = session.user.role === "ADMIN"
    if (!isOwner && !isAdmin) {
      return { success: false, error: "삭제 권한이 없습니다" }
    }

    await db.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    })

    return { success: true, data: { id: commentId } }
  } catch (error) {
    console.error("[deleteComment]", error)
    return { success: false, error: "댓글 삭제 중 오류가 발생했습니다" }
  }
}
