"use client"

import { useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDateSimple } from "@/lib/utils"
import { deleteComment } from "@/lib/actions/comment"
import { Button } from "@/components/ui/button"
import type { CommentWithUser } from "@/types"

type Props = {
  comment: CommentWithUser
  currentUserId?: string
}

export function CommentItem({ comment, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const canDelete = currentUserId && currentUserId === comment.userId

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteComment(comment.id)
      if (result.success) {
        toast.success("댓글이 삭제되었습니다")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const user = comment.user

  return (
    <div className="flex gap-3 py-4 border-b border-border/60 last:border-b-0">
      {/* 아바타 */}
      <div className="shrink-0">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "사용자"}
            width={32}
            height={32}
            className="rounded-full ring-1 ring-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary ring-1 ring-border">
            {(user.name ?? "?")[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{user.name ?? "익명"}</span>
            <time className="text-xs text-muted-foreground shrink-0">
              {formatDateSimple(comment.createdAt)}
            </time>
          </div>
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-muted-foreground/60 hover:text-destructive shrink-0"
              onClick={handleDelete}
              disabled={isPending}
              aria-label="댓글 삭제"
            >
              <Trash2 size={12} />
            </Button>
          )}
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
          {comment.content}
        </p>
      </div>
    </div>
  )
}
