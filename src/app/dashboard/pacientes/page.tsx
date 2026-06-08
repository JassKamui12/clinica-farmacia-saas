'use client';

import { useEffect, useState } from "react";

interface Paciente {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  status: string;
  createdAt: string;
  _count: { appointments: number; clinicalVisits: number };
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/pacientes?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.pacientes)) setPacientes(d.pacientes);
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
          <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-slate-500 text-sm mt-1">{total} pacientes registrados</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#051125] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#1b263b] transition-colors">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Nuevo paciente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="w-full max-w-md pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : pacientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">group</span>
            <p className="font-medium">{q ? "Sin resultados para la búsqueda" : "No hay pacientes registrados"}</p>
            <p className="text-sm mt-1">Agrega el primer paciente desde el botón de arriba</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pacientes.map((p) => (
              <div key={p.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#051125]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#051125] font-bold text-sm">{p.name.charAt(0).toUpperCase()}</span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 truncate">{p.phone ?? p.email ?? "Sin contacto"}</p>
                </div>
                {/* Conteos */}
                <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 shrink-0">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                    {p._count.appointments} citas
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">folder_shared</span>
                    {p._count.clinicalVisits} consultas
                  </span>
                </div>
                <span className="material-symbols-outlined text-slate-300 text-[20px] shrink-0">chevron_right</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
