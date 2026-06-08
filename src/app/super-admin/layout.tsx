import { requireSuperAdmin } from "@/lib/auth";
import SuperAdminSidebar from "@/components/super-admin/SuperAdminSidebar";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar />
      <main className="flex-1 pl-[240px]">{children}</main>
    </div>
  );
}
