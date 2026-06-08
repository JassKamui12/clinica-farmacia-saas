'use client';

import { useEffect, useState } from "react";

interface Medicamento {
  nombre: string;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  cantidad?: number;
}

interface Receta {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  status: string;
  diagnosis: string | null;
  notes: string | null;
  medications: Medicamento[];
  patient: { id: string; name: string; phone: string | null };
  doctor: { id: string; name: string | null; specialty: string | null };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: "Vigente",    color: "bg-emerald-100 text-emerald-700" },
  DISPENSED: { label: "Dispensada", color: "bg-blue-100 text-blue-700" },
  EXPIRED:   { label: "Vencida",    color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelada",  color: "bg-slate-100 text-slate-500" },
};

export default function RecetasPage() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Receta | null>(null);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/recetas?status=${statusFilter}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.recetas)) setRecetas(d.recetas);
        if (d.total != null) setTotal(d.total);
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recetas</h1>
          <p className="text-slate-500 text-sm mt-1">{total} recetas {statusFilter === "ACTIVE" ? "vigentes" : ""}</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#051125] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#1b263b] transition-colors">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva receta
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === key
                ? "bg-[#051125] text-white border-[#051125]"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4 animate-pulse space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : recetas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3">medication</span>
              <p className="font-medium">Sin recetas {STATUS_LABELS[statusFilter]?.label.toLowerCase()}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recetas.map((r) => {
                const st = STATUS_LABELS[r.status] ?? { label: r.status, color: "bg-slate-100 text-slate-600" };
                const isSelected = selected?.id === r.id;
                const meds = Array.isArray(r.medications) ? r.medications : [];
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(isSelected ? null : r)}
                    className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors ${isSelected ? "bg-slate-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm truncate">{r.patient.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {meds.length} medicamento{meds.length !== 1 ? "s" : ""}
                          {r.diagnosis ? ` · ${r.diagnosis}` : ""}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(r.createdAt).toLocaleDateString("es-HN", { day: "numeric", month: "short" })}
                          {r.expiresAt && ` · Vence ${new Date(r.expiresAt).toLocaleDateString("es-HN", { day: "numeric", month: "short" })}`}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selected ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Detalle de receta</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-[#051125]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#051125] font-bold text-sm">{selected.patient.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{selected.patient.name}</p>
                  <p className="text-xs text-slate-500">{selected.doctor.name} · {selected.doctor.specialty}</p>
                </div>
              </div>

              {selected.diagnosis && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Diagnóstico</p>
                  <p className="text-sm text-slate-700">{selected.diagnosis}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Medicamentos</p>
                <div className="space-y-2">
                  {(Array.isArray(selected.medications) ? selected.medications : []).map((med, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-3">
                      <p className="font-semibold text-slate-900 text-sm">{med.nombre}</p>
                      {med.dosis && <p className="text-xs text-slate-600 mt-0.5">Dosis: {med.dosis}</p>}
                      {med.frecuencia && <p className="text-xs text-slate-600">Frecuencia: {med.frecuencia}</p>}
                      {med.duracion && <p className="text-xs text-slate-600">Duración: {med.duracion}</p>}
                      {med.cantidad && <p className="text-xs text-slate-500 mt-0.5">Cantidad: {med.cantidad} unidades</p>}
                    </div>
                  ))}
                </div>
              </div>

              {selected.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notas</p>
                  <p className="text-sm text-slate-700">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 flex items-center justify-center py-14 text-slate-300">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl block mb-2">touch_app</span>
              <p className="text-sm">Selecciona una receta para ver el detalle</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
