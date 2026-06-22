import { CommentItem } from "@/components/blog/comment-item"
import type { CommentWithUser } from "@/types"

type Props = {
  comments: CommentWithUser[]
  currentUserId?: string
}

export function CommentList({ comments, currentUserId }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 tracking-wide uppercase">
        댓글 {comments.length}개
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          아직 댓글이 없어요. 첫 번째 댓글을 남겨보세요.
        </p>
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
