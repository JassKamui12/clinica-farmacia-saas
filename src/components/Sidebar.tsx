'use client';

import { signOut } from "next-auth/react";
import Link from "next/link";

type UserRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  roles: UserRole[];
}

const roleDashboard: Record<UserRole, string> = {
  ADMIN: "/admin",
  DOCTOR: "/doctor",
  PHARMACIST: "/pharmacist",
  RECEPTIONIST: "/appointments",
};

const baseNavItems: NavItem[] = [
  { href: "/patients",      icon: "group",            label: "Pacientes",      roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { href: "/appointments",  icon: "calendar_month",   label: "Citas",          roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { href: "/consultations", icon: "stethoscope",      label: "Consultas",      roles: ["ADMIN", "DOCTOR"] },
  { href: "/triage",        icon: "emergency",        label: "Triage IA",      roles: ["ADMIN", "DOCTOR"] },
  { href: "/followups",     icon: "monitor_heart",    label: "Seguimiento",    roles: ["ADMIN", "DOCTOR"] },
  { href: "/prescriptions", icon: "pill",             label: "Recetas",        roles: ["ADMIN", "DOCTOR"] },
  { href: "/inventory",     icon: "inventory_2",      label: "Inventario",     roles: ["ADMIN", "PHARMACIST"] },
  { href: "/whatsapp",      icon: "chat",             label: "WhatsApp IA",    roles: ["ADMIN", "DOCTOR", "PHARMACIST", "RECEPTIONIST"] },
  { href: "/admin",         icon: "settings",         label: "Administración", roles: ["ADMIN"] },
];

interface SidebarProps {
  activePath: string;
  userRole: UserRole;
  userName?: string | null;
  userEmail?: string | null;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  DOCTOR: "Médico",
  PHARMACIST: "Farmacéutico",
  RECEPTIONIST: "Recepcionista",
};

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-blue-500",
  DOCTOR: "bg-emerald-500",
  PHARMACIST: "bg-violet-500",
  RECEPTIONIST: "bg-amber-500",
};

export default function Sidebar({ activePath, userRole, userName, userEmail }: SidebarProps) {
  const dashboardHref = roleDashboard[userRole];
  const dashboardItem: NavItem = {
    href: dashboardHref,
    icon: "space_dashboard",
    label: "Dashboard",
    roles: [userRole],
  };
  const visibleItems = [dashboardItem, ...baseNavItems.filter((item) => item.roles.includes(userRole))];

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#0F2744] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-lg">medical_services</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">MediFlow Pro</h1>
            <p className="text-blue-300/60 text-[10px] uppercase tracking-widest leading-none mt-0.5">Gestión Clínica</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] shrink-0 ${isActive ? "text-blue-300" : ""}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className={`w-8 h-8 rounded-lg ${roleColors[userRole]} flex items-center justify-center shrink-0`}>
            <span className="text-white text-xs font-bold">
              {(userName || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{userName || "Usuario"}</p>
            <p className="text-slate-400 text-xs truncate">{roleLabels[userRole]}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors rounded-xl w-full text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
