import { notFound } from "next/navigation";
import { PostEditorPage } from "@/components/admin/PostEditorPage";
import { getPostById } from "@/lib/actions/post";
import { getAllCategories } from "@/lib/actions/category";
import { getComments } from "@/lib/actions/comment";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await getPostById(Number(id));
  const title = result.success ? result.data.title : "포스트 수정";
  return { title: `${title} 수정 | dvlog admin` };
}

export default async function EditorEditPage({ params }: Props) {
  const { id } = await params;
  const postId = Number(id);

  if (isNaN(postId)) notFound();

  const [postResult, categoriesResult, commentsResult] = await Promise.all([
    getPostById(postId),
    getAllCategories(),
    getComments(postId),
  ]);

  if (!postResult.success) notFound();

  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : [];
  const comments = commentsResult.success ? commentsResult.data : [];

  return (
    <PostEditorPage
      categories={categories}
      post={postResult.data}
      initialComments={comments}
    />
  );
}
