'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  roles: string[];
  rubroOnly?: string[]; // solo mostrar para estos rubros
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Clínico",
    items: [
      { href: "/dashboard/inicio",      icon: "space_dashboard", label: "Inicio",      roles: ["ADMIN", "DOCTOR", "RECEPTIONIST", "PHARMACIST"] },
      { href: "/dashboard/citas",        icon: "calendar_month",  label: "Citas",        roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
      { href: "/dashboard/pacientes",    icon: "group",           label: "Pacientes",    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
      { href: "/dashboard/expedientes",  icon: "folder_shared",   label: "Expedientes",  roles: ["ADMIN", "DOCTOR"] },
      { href: "/dashboard/recetas",      icon: "medication",      label: "Recetas",      roles: ["ADMIN", "DOCTOR"] },
      { href: "/dashboard/doctores",     icon: "stethoscope",     label: "Doctores",     roles: ["ADMIN"] },
    ],
  },
  {
    section: "Farmacia",
    items: [
      { href: "/dashboard/inventario", icon: "inventory_2",  label: "Inventario", roles: ["ADMIN", "PHARMACIST"], rubroOnly: ["farmacia"] },
      { href: "/dashboard/ventas",     icon: "point_of_sale", label: "Ventas",    roles: ["ADMIN", "PHARMACIST"], rubroOnly: ["farmacia"] },
    ],
  },
  {
    section: "Comunicación",
    items: [
      { href: "/dashboard/mensajes",       icon: "chat",             label: "WhatsApp IA", roles: ["ADMIN", "DOCTOR", "RECEPTIONIST", "PHARMACIST"] },
      { href: "/dashboard/configuracion",  icon: "settings",         label: "Configuración", roles: ["ADMIN"] },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  DOCTOR: "Médico",
  PHARMACIST: "Farmacéutico",
  RECEPTIONIST: "Recepcionista",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-blue-500",
  DOCTOR: "bg-emerald-500",
  PHARMACIST: "bg-violet-500",
  RECEPTIONIST: "bg-amber-500",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();

  const role = profile?.role ?? "ADMIN";
  const rubroId = profile?.clinic?.rubroId ?? "";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#051125] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/dashboard/inicio" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-300 text-lg">medical_services</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm leading-tight truncate">
              {profile?.clinic?.name ?? "Clinica SaaS"}
            </h1>
            <p className="text-blue-300/50 text-[10px] uppercase tracking-widest leading-none mt-0.5 truncate">
              {profile?.clinic?.rubroId?.replace(/-/g, " ") ?? "gestión clínica"}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV.map(({ section, items }) => {
          const visible = items.filter((item) => {
            const roleOk = item.roles.includes(role);
            const rubroOk = !item.rubroOnly || item.rubroOnly.includes(rubroId);
            return roleOk && rubroOk;
          });
          if (visible.length === 0) return null;
          return (
            <div key={section}>
              <p className="px-3 pb-1 text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                {section}
              </p>
              <div className="space-y-0.5">
                {visible.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-white/15 text-white"
                          : "text-slate-400 hover:text-white hover:bg-white/8"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] shrink-0 ${active ? "text-blue-300" : ""}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className={`w-8 h-8 rounded-lg ${ROLE_COLORS[role] ?? "bg-slate-500"} flex items-center justify-center shrink-0`}>
            <span className="text-white text-xs font-bold">
              {(profile?.name ?? "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{profile?.name ?? "Usuario"}</p>
            <p className="text-slate-400 text-xs truncate">{ROLE_LABELS[role] ?? role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors rounded-xl w-full text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
