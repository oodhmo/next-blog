import { auth } from "@/auth"
import { getComments } from "@/lib/actions/comment"
import { CommentForm } from "@/components/blog/comment-form"
import { CommentList } from "@/components/blog/comment-list"
import { Separator } from "@/components/ui/separator"

type Props = {
  postId: number
}

export async function CommentsSection({ postId }: Props) {
  const [session, commentsResult] = await Promise.all([
    auth(),
    getComments(postId),
  ])

  const comments = commentsResult.success ? commentsResult.data : []
  const currentUserId = session?.user?.id

  return (
    <section aria-label="댓글">
      <CommentForm postId={postId} />
      <Separator className="my-6" />
      <CommentList comments={comments} currentUserId={currentUserId} />
    </section>
  )
}
