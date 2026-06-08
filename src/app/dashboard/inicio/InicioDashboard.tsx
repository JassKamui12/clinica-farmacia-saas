'use client';

import Link from "next/link";
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
  {
    key: "citasHoy",
    label: "Citas hoy",
    icon: "calendar_month",
    gradient: "from-blue-500 to-blue-600",
    lightBg: "bg-blue-50",
    lightBorder: "border-blue-100",
    textColor: "text-blue-600",
  },
  {
    key: "totalPacientes",
    label: "Pacientes",
    icon: "group",
    gradient: "from-emerald-500 to-emerald-600",
    lightBg: "bg-emerald-50",
    lightBorder: "border-emerald-100",
    textColor: "text-emerald-600",
  },
  {
    key: "citasPendientes",
    label: "Por confirmar",
    icon: "pending_actions",
    gradient: "from-amber-500 to-orange-500",
    lightBg: "bg-amber-50",
    lightBorder: "border-amber-100",
    textColor: "text-amber-600",
  },
  {
    key: "expedientesHoy",
    label: "Consultas hoy",
    icon: "folder_shared",
    gradient: "from-violet-500 to-violet-600",
    lightBg: "bg-violet-50",
    lightBorder: "border-violet-100",
    textColor: "text-violet-600",
  },
] as const;

const QUICK_ACTIONS: { href: string; icon: string; label: string; primary?: boolean }[] = [
  { href: "/dashboard/citas",     icon: "add_circle",  label: "Nueva cita",  primary: true },
  { href: "/dashboard/pacientes", icon: "person_add",  label: "Paciente" },
  { href: "/dashboard/recetas",   icon: "medication",  label: "Receta" },
  { href: "/dashboard/mensajes",  icon: "chat",        label: "WhatsApp" },
];

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
  const greeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  const firstName = profile?.name?.split(" ")[0] ?? "Doctor";

  const isTrialEnding =
    clinic?.plan === "trial" &&
    clinic.trialEndsAt &&
    new Date(clinic.trialEndsAt).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000;

  const trialDaysLeft = clinic?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(clinic.trialEndsAt).getTime() - now.getTime()) / 86400000))
    : null;

  const rubroLabel = clinic?.rubroId
    ? clinic.rubroId.charAt(0).toUpperCase() + clinic.rubroId.slice(1).replace(/-/g, " ")
    : "";

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm">
            {now.toLocaleDateString("es-HN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
            {greeting}, {firstName}
          </h1>
        </div>
        {clinic && (
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">business</span>
            <div>
              <p className="text-slate-900 text-sm font-medium leading-tight">{clinic.name}</p>
              <p className="text-slate-400 text-xs">{rubroLabel}</p>
            </div>
            <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              clinic.plan === "trial"
                ? "bg-amber-100 text-amber-700"
                : clinic.plan === "pro"
                ? "bg-purple-100 text-purple-700"
                : "bg-emerald-100 text-emerald-700"
            }`}>
              {clinic.plan}
            </span>
          </div>
        )}
      </div>

      {/* ── Banner trial expirando ── */}
      {isTrialEnding && trialDaysLeft !== null && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 flex items-center gap-4 shadow-lg shadow-amber-500/20">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-xl">hourglass_top</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">
              Tu período de prueba vence en {trialDaysLeft} día{trialDaysLeft !== 1 ? "s" : ""}
            </p>
            <p className="text-white/70 text-sm mt-0.5">
              Suscríbete ahora para no perder el acceso a tu clínica.
            </p>
          </div>
          <Link href="/dashboard/configuracion"
            className="shrink-0 rounded-xl bg-white text-amber-600 text-sm font-semibold px-4 py-2 hover:bg-amber-50 transition-colors shadow-sm">
            Suscribirme
          </Link>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon, lightBg, lightBorder, textColor }) => (
          <div key={key}
            className={`rounded-2xl border ${lightBorder} ${lightBg} p-5 hover:shadow-md transition-shadow`}>
            <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4`}>
              <span className={`material-symbols-outlined text-[22px] ${textColor}`}>{icon}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats[key as keyof Stats]}
            </p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Acciones rápidas ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}
              className={`flex flex-col items-center gap-2.5 rounded-2xl px-4 py-5 font-medium text-sm text-center transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm ${
                action.primary
                  ? "bg-[#051125] text-white shadow-slate-900/20 hover:bg-[#1b263b]"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}>
              <span className={`material-symbols-outlined text-[26px] ${action.primary ? "text-white" : "text-slate-500"}`}>
                {action.icon}
              </span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Estado de WhatsApp ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">chat</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Bot WhatsApp IA</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {clinic?.plan === "trial"
                  ? "Configura tu número en Configuración → WhatsApp"
                  : "Responde citas automáticamente 24/7"}
              </p>
            </div>
          </div>
          <Link href="/dashboard/configuracion"
            className="rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 hover:bg-slate-50 hover:border-slate-300 transition-colors">
            Configurar
          </Link>
        </div>
      </div>
    </div>
  );
}
