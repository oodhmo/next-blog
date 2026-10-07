import { PostEditorPage } from "@/components/admin/PostEditorPage";
import { getAllCategories } from "@/lib/actions/category";

export const metadata = {
  title: "새 글 작성 | admin",
};

export default async function EditorPage() {
  const result = await getAllCategories();
  const categories = result.success ? result.data : [];

  return <PostEditorPage categories={categories ?? []} />;
}
