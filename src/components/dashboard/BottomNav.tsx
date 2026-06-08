'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";

const BOTTOM_NAV = [
  { href: "/dashboard/inicio",    icon: "space_dashboard", label: "Inicio" },
  { href: "/dashboard/citas",     icon: "calendar_month",  label: "Citas" },
  { href: "/dashboard/pacientes", icon: "group",           label: "Pacientes" },
  { href: "/dashboard/mensajes",  icon: "chat",            label: "WhatsApp" },
  { href: "/dashboard/configuracion", icon: "settings",    label: "Config" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const role = profile?.role ?? "ADMIN";

  // Farmacéutico ve inventario en vez de pacientes
  const items = role === "PHARMACIST"
    ? BOTTOM_NAV.map((i) => i.href === "/dashboard/pacientes"
        ? { href: "/dashboard/inventario", icon: "inventory_2", label: "Inventario" }
        : i)
    : BOTTOM_NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-50 lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              active ? "text-[#051125]" : "text-slate-400"
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${active ? "text-[#051125]" : ""}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-medium ${active ? "text-[#051125]" : "text-slate-400"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
