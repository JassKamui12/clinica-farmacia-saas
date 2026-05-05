'use client';

import { signOut } from "next-auth/react";
import Link from "next/link";

type UserRole = "ADMIN" | "DOCTOR" | "PHARMACIST";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/", icon: "dashboard", label: "Dashboard", roles: ["ADMIN", "DOCTOR", "PHARMACIST"] },
  { href: "/patients", icon: "person", label: "Pacientes", roles: ["ADMIN", "DOCTOR"] },
  { href: "/appointments", icon: "calendar_month", label: "Citas", roles: ["ADMIN", "DOCTOR"] },
  { href: "/consultations", icon: "medical_services", label: "Consultas", roles: ["ADMIN", "DOCTOR"] },
  { href: "/triage", icon: "emergency", label: "Triage IA", roles: ["ADMIN", "DOCTOR"] },
  { href: "/followups", icon: "monitor_heart", label: "Seguimiento", roles: ["ADMIN", "DOCTOR"] },
  { href: "/prescriptions", icon: "medication", label: "Recetas", roles: ["ADMIN", "DOCTOR", "PHARMACIST"] },
  { href: "/inventory", icon: "inventory_2", label: "Inventario", roles: ["ADMIN", "PHARMACIST"] },
  { href: "/pharmacist", icon: "local_pharmacy", label: "Panel Farmacia", roles: ["PHARMACIST"] },
  { href: "/whatsapp", icon: "chat", label: "WhatsApp", roles: ["ADMIN", "DOCTOR", "PHARMACIST"] },
  { href: "/admin", icon: "settings", label: "Administración", roles: ["ADMIN"] },
];

interface SidebarProps {
  activePath: string;
  userRole: UserRole;
  userName?: string | null;
  userEmail?: string | null;
}

export default function Sidebar({ activePath, userRole, userName, userEmail }: SidebarProps) {
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));
  const roleLabels: Record<UserRole, string> = {
    ADMIN: "Administrador",
    DOCTOR: "Médico",
    PHARMACIST: "Farmacéutico",
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] border-r border-[#30363D] bg-[#0A0C10] flex flex-col py-6 z-50">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00F5A0] flex items-center justify-center">
          <span className="material-symbols-outlined text-lg text-[#0A0C10]">medical_services</span>
        </div>
        <div>
          <h1 className="text-[#00F5A0] font-bold text-lg">MediFlow Pro</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">{roleLabels[userRole]}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {visibleItems.map((item) => {
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 transition-colors rounded-lg ${
                isActive
                  ? "bg-[#161B22] text-[#00F5A0] border-l-4 border-[#00F5A0] font-semibold rounded-r-lg"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#161B22]"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 border-t border-[#30363D] pt-3 space-y-1">
        <div className="px-4 py-3 mb-2">
          <p className="text-sm text-slate-300 font-medium truncate">{userName || "Usuario"}</p>
          <p className="text-xs text-slate-500 truncate">{userEmail || ""}</p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors rounded-lg w-full"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
