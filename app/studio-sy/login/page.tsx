import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudioSyLoginView } from "@/components/admin/studio-sy-login-view";

export default async function StudioSyLoginPage() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/studio-sy");
  }

  return <StudioSyLoginView />;
}
