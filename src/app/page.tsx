import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  if (role === "DOCTOR") redirect("/doctor");
  if (role === "PHARMACIST") redirect("/pharmacist");
  redirect("/admin");
}
