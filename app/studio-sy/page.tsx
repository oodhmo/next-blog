import { getPostStats } from "@/lib/actions/post";
import { getAllCategories, getAllTags } from "@/lib/actions/category";
import { AdminView } from "@/components/admin/admin-view";

export default async function AdminPage() {
  const [statsResult, categoriesResult, tagsResult] = await Promise.all([
    getPostStats(),
    getAllCategories(),
    getAllTags(),
  ]);

  const stats = statsResult.success
    ? statsResult.data
    : { total: 0, published: 0, unpublished: 0 };

  const categories = categoriesResult.success ? categoriesResult.data : [];
  const tags = tagsResult.success ? tagsResult.data : [];

  return <AdminView stats={stats} initialCategories={categories} initialTags={tags} />;
}
