import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, estimateReadTime } from "@/lib/utils";
import { Clock, Eye, Calendar } from "lucide-react";
import { CommentsSection } from "@/components/blog/comments-section";
import type { PostWithRelations } from "@/types";

type PostDetailProps = {
  post: PostWithRelations;
};

export function PostDetail({ post }: PostDetailProps) {
  return (
    <article className="mx-auto max-w-2xl">
      {/* 헤더 */}
      <header className="mb-8">
        {/* 카테고리 */}
        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map(({ category }) => (
              <Badge key={category.id} variant="default">
                {category.name}
              </Badge>
            ))}
          </div>
        )}

        <h1 className="text-3xl font-bold leading-tight sm:text-4xl mb-4">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg text-muted-foreground mb-4">{post.excerpt}</p>
        )}

        {/* 메타 정보 */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {post.author.avatar && (
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span>{post.author.name}</span>
          </div>
          {post.publishedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.publishedAt.toISOString()}>
                {formatDate(post.publishedAt)}
              </time>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>약 {estimateReadTime(post.content)}분</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{post.viewCount.toLocaleString()}회</span>
          </div>
        </div>
      </header>

      {/* 커버 이미지 */}
      {post.coverImage && (
        <div className="relative h-64 w-full overflow-hidden rounded-xl mb-8 bg-muted">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <Separator className="mb-8" />

      {/* 본문 */}
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* 태그 */}
      {post.tags.length > 0 && (
        <>
          <Separator className="my-8" />
          <div className="flex flex-wrap gap-2">
            {post.tags.map(({ tag }) => (
              <Badge key={tag.id} variant="outline">
                #{tag.name}
              </Badge>
            ))}
          </div>
        </>
      )}

      {/* 댓글 */}
      <Separator className="my-8" />
      <CommentsSection postId={post.id} />
    </article>
  );
}
