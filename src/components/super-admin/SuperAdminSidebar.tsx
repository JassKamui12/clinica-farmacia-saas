'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/super-admin/panel",    icon: "dashboard",     label: "Panel" },
  { href: "/super-admin/clinicas", icon: "business",      label: "Clínicas" },
  { href: "/super-admin/rubros",   icon: "category",      label: "Rubros" },
  { href: "/super-admin/pagos",    icon: "payments",      label: "Pagos" },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#051125] flex flex-col z-50">
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M14 7.5C14 7.5 13 6 11.5 6C9.8 6 8.5 7.2 8.5 8.8C8.5 10.4 10 11.2 11.5 11.7C13 12.2 14.5 13 14.5 14.7C14.5 16.4 13.2 17.5 11.5 17.5C9.8 17.5 8.8 16.5 8.8 16.5"
                stroke="#67e8f9" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-bold text-sm tracking-tight">Salus</span>
              <span className="text-cyan-400/60 text-[9px] font-medium uppercase tracking-widest">IA</span>
            </div>
            <p className="text-red-300/50 text-[10px] uppercase tracking-widest leading-none mt-0.5">Super Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? "bg-white/15 text-white" : "text-slate-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] shrink-0 ${active ? "text-red-300" : ""}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/10">
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
