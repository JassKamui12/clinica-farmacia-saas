'use client';

import { useEffect, useState } from "react";

interface Clinica {
  id: string;
  name: string;
  rubroId: string;
  plan: string;
  isActive: boolean;
  trialEndsAt: string | null;
  slug: string;
  createdAt: string;
  _count: { patients: number; appointments: number; users: number };
}

const PLAN_COLORS: Record<string, string> = {
  trial: "bg-amber-100 text-amber-700",
  basico: "bg-blue-100 text-blue-700",
  pro: "bg-emerald-100 text-emerald-700",
};

export default function SuperAdminClinicas() {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/super-admin/clinicas?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.clinicas)) setClinicas(d.clinicas);
          if (d.total != null) setTotal(d.total);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clínicas</h1>
          <p className="text-slate-500 text-sm mt-1">{total} clínicas registradas</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar clínica..."
          className="w-full max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : clinicas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">business</span>
            <p className="font-medium">No hay clínicas registradas</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clinicas.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#051125]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#051125] font-bold text-sm">{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm truncate">{c.name}</p>
                    <span className="text-slate-300 text-xs">·</span>
                    <span className="text-xs text-slate-500">/{c.slug}</span>
                  </div>
                  <p className="text-xs text-slate-500 capitalize">{c.rubroId.replace(/-/g, " ")}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 shrink-0">
                  <span>{c._count.patients} pac.</span>
                  <span>{c._count.users} users</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${PLAN_COLORS[c.plan] ?? "bg-slate-100 text-slate-600"}`}>
                  {c.plan}
                </span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${c.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
