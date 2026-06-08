'use client';

import { useEffect, useState } from "react";

interface Stats {
  totalClinics: number;
  activeClinics: number;
  trialClinics: number;
  totalPatients: number;
  totalAppointments: number;
  clinicsByRubro: { rubroId: string; count: number }[];
}

const STAT_CARDS = [
  { key: "totalClinics",       label: "Total clínicas",   icon: "business",        color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100" },
  { key: "activeClinics",      label: "Clínicas activas", icon: "check_circle",    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { key: "trialClinics",       label: "En trial",         icon: "hourglass_top",   color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
  { key: "totalPatients",      label: "Total pacientes",  icon: "group",           color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100" },
  { key: "totalAppointments",  label: "Total citas",      icon: "calendar_month",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
] as const;

export default function SuperAdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Panel de control</h1>
        <p className="text-slate-500 text-sm mt-1">Vista global de todas las clínicas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, icon, color, bg, border }) => (
          <div key={key} className={`rounded-2xl border ${border} ${bg} p-5`}>
            <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
            <p className="text-3xl font-bold text-slate-900 mt-3">
              {loading ? "—" : (stats?.[key as keyof Stats] as number) ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Clínicas por rubro */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Clínicas por tipo</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-3 bg-slate-100 rounded flex-1" />
                <div className="h-3 bg-slate-100 rounded w-8" />
              </div>
            ))}
          </div>
        ) : !stats?.clinicsByRubro.length ? (
          <p className="text-slate-400 text-sm">Sin datos</p>
        ) : (
          <div className="space-y-3">
            {stats.clinicsByRubro.map(({ rubroId, count }) => {
              const max = stats.clinicsByRubro[0].count;
              return (
                <div key={rubroId} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-36 shrink-0 capitalize">
                    {rubroId.replace(/-/g, " ")}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#051125] rounded-full"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
