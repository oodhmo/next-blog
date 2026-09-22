import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/studio-sy/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/studio-sy/login?error=admin_required");
  }

  return <>{children}</>;
}
