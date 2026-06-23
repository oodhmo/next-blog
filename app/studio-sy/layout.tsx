import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/studio-sy");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <>{children}</>;
}
