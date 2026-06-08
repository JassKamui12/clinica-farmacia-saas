'use client';

import { useEffect, useState } from "react";

interface Doctor {
  id: string;
  name: string | null;
  email: string;
  role: string;
  specialty: string | null;
  whatsappPhone: string | null;
  isActive: boolean;
  _count: { appointments: number };
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  DOCTOR: "Médico",
  PHARMACIST: "Farmacéutico",
  RECEPTIONIST: "Recepcionista",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-blue-100 text-blue-700",
  DOCTOR: "bg-emerald-100 text-emerald-700",
  PHARMACIST: "bg-violet-100 text-violet-700",
  RECEPTIONIST: "bg-amber-100 text-amber-700",
};

export default function DoctoresPage() {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/doctores")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setDoctores(d); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipo médico</h1>
          <p className="text-slate-500 text-sm mt-1">{doctores.length} miembros del equipo</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#051125] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#1b263b] transition-colors">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Agregar miembro
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : doctores.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">stethoscope</span>
            <p className="font-medium">No hay miembros del equipo</p>
            <p className="text-sm mt-1">Agrega doctores, recepcionistas o farmacéuticos</p>
          </div>
        ) : (
          doctores.map((d) => (
            <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#051125]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#051125] font-bold text-lg">
                    {(d.name ?? "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-sm truncate">{d.name ?? "Sin nombre"}</p>
                  <p className="text-xs text-slate-500 truncate">{d.specialty ?? d.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLORS[d.role] ?? "bg-slate-100 text-slate-600"}`}>
                  {ROLE_LABELS[d.role] ?? d.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  {d._count.appointments} citas
                </span>
                {d.whatsappPhone && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">chat</span>
                    {d.whatsappPhone}
                  </span>
                )}
                <span className={`w-2 h-2 rounded-full ${d.isActive ? "bg-emerald-400" : "bg-red-400"}`} title={d.isActive ? "Activo" : "Inactivo"} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
