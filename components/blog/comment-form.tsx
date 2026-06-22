"use client"

import { useState, useTransition } from "react"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { Button } from "@/components/ui/button"
import { createComment } from "@/lib/actions/comment"

type Props = {
  postId: number
}

export function CommentForm({ postId }: Props) {
  const { data: session, status } = useSession()
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isLoading = status === "loading"
  const isLoggedIn = !!session?.user

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      const result = await createComment({ postId, content: content.trim() })
      if (result.success) {
        toast.success("댓글이 등록되었습니다")
        setContent("")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      {/* 좌측: OAuth 버튼 또는 로그인 유저 정보 */}
      <div className="flex flex-col items-center gap-1.5 pt-0.5">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        ) : isLoggedIn ? (
          <>
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "사용자"}
                width={36}
                height={36}
                className="rounded-full shrink-0 ring-1 ring-border"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0 ring-1 ring-border">
                {(session.user.name ?? "?")[0].toUpperCase()}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground w-10 text-center truncate leading-tight">
              {session.user.name ?? ""}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[10px] h-auto py-0.5 px-1 text-muted-foreground hover:text-foreground"
              onClick={() => signOut()}
            >
              로그아웃
            </Button>
          </>
        ) : (
          <OAuthButtons />
        )}
      </div>

      {/* 우측: 텍스트 영역 + 등록 버튼 */}
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!isLoggedIn || isPending}
          placeholder={
            isLoggedIn ? "댓글을 작성해주세요..." : "로그인 후 댓글을 작성할 수 있어요"
          }
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-border bg-white dark:bg-[#131328] text-foreground dark:text-white px-3 py-2.5 text-sm font-sans leading-relaxed resize-none transition-colors placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isLoggedIn && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{content.length} / 1000</span>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isPending}
            >
              {isPending ? "등록 중..." : "댓글 등록"}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}
