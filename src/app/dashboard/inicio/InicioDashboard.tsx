'use client';

import { useProfile } from "@/contexts/ProfileContext";

interface Stats {
  citasHoy: number;
  totalPacientes: number;
  citasPendientes: number;
  expedientesHoy: number;
}

interface ClinicInfo {
  name: string;
  rubroId: string;
  plan: string;
  trialEndsAt: Date | null;
}

const STAT_CARDS = [
  { key: "citasHoy",        label: "Citas hoy",         icon: "calendar_month",  color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100" },
  { key: "totalPacientes",  label: "Total pacientes",   icon: "group",           color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { key: "citasPendientes", label: "Citas pendientes",  icon: "pending_actions", color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
  { key: "expedientesHoy",  label: "Consultas hoy",     icon: "folder_shared",   color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100" },
] as const;

export default function InicioDashboard({
  stats,
  clinic,
}: {
  stats: Stats;
  clinic: ClinicInfo | null;
}) {
  const { profile } = useProfile();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  const isTrialEnding =
    clinic?.plan === "trial" &&
    clinic.trialEndsAt &&
    new Date(clinic.trialEndsAt).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {profile?.name?.split(" ")[0] ?? "Doctor"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {now.toLocaleDateString("es-HN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Banner trial por vencer */}
      {isTrialEnding && clinic?.trialEndsAt && (
        <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-500 text-2xl shrink-0">warning</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Tu período de prueba termina pronto</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Vence el {new Date(clinic.trialEndsAt).toLocaleDateString("es-HN", { day: "numeric", month: "long" })}. Suscríbete para no perder el acceso.
            </p>
          </div>
          <a href="/dashboard/configuracion" className="ml-auto shrink-0 rounded-xl bg-amber-500 text-white text-xs font-semibold px-4 py-2 hover:bg-amber-600 transition-colors">
            Suscribirme
          </a>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, icon, color, bg, border }) => (
          <div key={key} className={`rounded-2xl border ${border} ${bg} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats[key as keyof Stats]}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/dashboard/citas",     icon: "add_circle",    label: "Nueva cita",    bg: "bg-[#051125]", text: "text-white" },
            { href: "/dashboard/pacientes", icon: "person_add",    label: "Nuevo paciente", bg: "bg-white",    text: "text-slate-800", border: "border border-slate-200" },
            { href: "/dashboard/recetas",   icon: "medication",    label: "Nueva receta",   bg: "bg-white",    text: "text-slate-800", border: "border border-slate-200" },
            { href: "/dashboard/mensajes",  icon: "chat",          label: "WhatsApp IA",    bg: "bg-white",    text: "text-slate-800", border: "border border-slate-200" },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className={`flex flex-col items-center gap-2 rounded-2xl ${action.bg} ${action.border ?? ""} ${action.text} p-4 hover:opacity-90 transition-opacity shadow-sm`}
            >
              <span className="material-symbols-outlined text-2xl">{action.icon}</span>
              <span className="text-xs font-semibold text-center">{action.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Clínica info */}
      {clinic && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#051125]/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#051125] text-xl">business</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{clinic.name}</p>
              <p className="text-slate-400 text-xs capitalize">{clinic.rubroId.replace(/-/g, " ")}</p>
            </div>
            <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${
              clinic.plan === "trial" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {clinic.plan === "trial" ? "Trial" : clinic.plan === "basico" ? "Básico" : "Pro"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
