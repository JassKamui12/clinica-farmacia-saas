import { ProfileProvider } from "@/contexts/ProfileContext";
import Sidebar from "@/components/dashboard/Sidebar";
import BottomNav from "@/components/dashboard/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      {/* Sidebar: visible solo desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <main className="lg:pl-[240px] pb-16 lg:pb-0 min-h-screen">
        {children}
      </main>

      {/* BottomNav: visible solo móvil */}
      <BottomNav />
    </ProfileProvider>
  );
}
