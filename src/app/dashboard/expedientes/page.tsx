'use client';

import { useEffect, useState } from "react";

interface Expediente {
  id: string;
  visitDate: string;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  patient: { id: string; name: string };
  doctor: { id: string; name: string | null; specialty: string | null };
}

export default function ExpedientesPage() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/expedientes")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.expedientes)) setExpedientes(d.expedientes); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expedientes</h1>
          <p className="text-slate-500 text-sm mt-1">Historial clínico por paciente</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#051125] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#1b263b] transition-colors">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva consulta
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-5 animate-pulse space-y-2">
                <div className="h-4 bg-slate-100 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : expedientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">folder_shared</span>
            <p className="font-medium">No hay expedientes registrados</p>
            <p className="text-sm mt-1">Los expedientes se crean después de cada consulta</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expedientes.map((exp) => (
              <div key={exp.id} className="px-6 py-5 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900 text-sm">{exp.patient.name}</p>
                      <span className="text-slate-300">·</span>
                      <p className="text-xs text-slate-500">
                        {new Date(exp.visitDate).toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    {exp.diagnosis && (
                      <p className="text-sm text-slate-700 line-clamp-1">
                        <span className="font-medium">Dx:</span> {exp.diagnosis}
                      </p>
                    )}
                    {exp.symptoms && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        <span className="font-medium">Sx:</span> {exp.symptoms}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Atendido por {exp.doctor.name ?? "—"} {exp.doctor.specialty ? `· ${exp.doctor.specialty}` : ""}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-[20px] shrink-0 mt-1">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
