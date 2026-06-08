'use client';

import { useEffect, useState } from "react";

interface Cita {
  id: string;
  date: string;
  time: string;
  status: string;
  service: string | null;
  reason: string | null;
  source: string;
  patient: { id: string; name: string; phone: string | null };
  doctor: { id: string; name: string | null; specialty: string | null };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: "Pendiente",   color: "bg-amber-100 text-amber-700" },
  CONFIRMED:   { label: "Confirmada",  color: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "En sala",     color: "bg-violet-100 text-violet-700" },
  COMPLETED:   { label: "Completada",  color: "bg-emerald-100 text-emerald-700" },
  CANCELLED:   { label: "Cancelada",   color: "bg-red-100 text-red-700" },
  NO_SHOW:     { label: "No asistió",  color: "bg-slate-100 text-slate-600" },
};

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/citas?date=${dateFilter}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.citas)) setCitas(d.citas); })
      .finally(() => setLoading(false));
  }, [dateFilter]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citas</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de agenda diaria</p>
        </div>
        <a
          href="#nueva"
          className="flex items-center gap-2 rounded-xl bg-[#051125] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#1b263b] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva cita
        </a>
      </div>

      {/* Filtro de fecha */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-slate-700">Fecha:</label>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <span className="text-sm text-slate-500">{citas.length} citas</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : citas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">calendar_month</span>
            <p className="font-medium">No hay citas para esta fecha</p>
            <p className="text-sm mt-1">Selecciona otra fecha o crea una nueva cita</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {citas.map((cita) => {
              const status = STATUS_LABELS[cita.status] ?? { label: cita.status, color: "bg-slate-100 text-slate-600" };
              return (
                <div key={cita.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  {/* Hora */}
                  <div className="w-16 text-center shrink-0">
                    <p className="font-bold text-slate-900 text-sm">{cita.time}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{cita.source}</p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-10 bg-slate-200 shrink-0" />

                  {/* Paciente */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{cita.patient.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {cita.service ?? cita.reason ?? "Sin motivo especificado"} · {cita.doctor.name ?? "Sin doctor"}
                    </p>
                  </div>

                  {/* Status */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
