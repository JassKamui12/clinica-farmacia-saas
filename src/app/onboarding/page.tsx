"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const RUBROS = [
  { id: "clinica-general",  label: "Clínica General",    icon: "stethoscope" },
  { id: "odontologia",      label: "Odontología",         icon: "dentistry" },
  { id: "farmacia",         label: "Farmacia",            icon: "medication" },
  { id: "pediatria",        label: "Pediatría",           icon: "child_care" },
  { id: "psicologia",       label: "Psicología",          icon: "psychology" },
  { id: "fisioterapia",     label: "Fisioterapia",        icon: "sports_gymnastics" },
  { id: "nutricion",        label: "Nutrición",           icon: "nutrition" },
  { id: "laboratorio",      label: "Laboratorio",         icon: "biotech" },
  { id: "veterinaria",      label: "Veterinaria",         icon: "pets" },
  { id: "optometria",       label: "Optometría",          icon: "visibility" },
] as const;

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [clinicName, setClinicName] = useState("");
  const [rubroId, setRubroId] = useState("clinica-general");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    const res = await fetch("/api/auth/setup-clinic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicName, rubroId, city }),
    });
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Error al crear la clínica"); setLoading(false); return; }
    router.push(data.redirectTo ?? "/dashboard/inicio");
  }

  const selectedRubro = RUBROS.find((r) => r.id === rubroId);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#051125] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M15 8C15 8 13.5 6 11.5 6C9.2 6 7.5 7.5 7.5 9.5C7.5 11.5 9.5 12.5 11.5 13.2C13.5 13.9 15.5 15 15.5 17.2C15.5 19.4 13.8 21 11.5 21C9.2 21 7.8 19.5 7.8 19.5"
                  stroke="#0d9488" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-[#051125] text-xl">
              Salus<span className="text-teal-600"> IA</span>
            </span>
          </div>

          {/* Pasos */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? "bg-[#051125] text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  {step > s ? "✓" : s}
                </div>
                {s < 2 && <div className={`w-8 h-px ${step > s ? "bg-[#051125]" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {step === 1 ? "¿Qué tipo de clínica tienes?" : "Últimos detalles"}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            {step === 1 ? "Elige tu especialidad para personalizar el bot IA" : "El bot se configura solo en segundos"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7">
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              {error}
            </div>
          )}

          {step === 1 ? (
            <div>
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {RUBROS.map((r) => (
                  <button key={r.id} type="button" onClick={() => setRubroId(r.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      rubroId === r.id
                        ? "border-teal-500 bg-teal-50 text-teal-800"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}>
                    <span className={`material-symbols-outlined text-[20px] shrink-0 ${rubroId === r.id ? "text-teal-600" : "text-slate-400"}`}>
                      {r.icon}
                    </span>
                    <span className="text-sm font-medium leading-tight">{r.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)}
                className="w-full rounded-xl bg-[#051125] text-white py-3 font-semibold text-sm hover:bg-[#1b263b] transition-colors">
                Continuar con {selectedRubro?.label} →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Nombre de la clínica
                </label>
                <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)}
                  className={INPUT} placeholder="Clínica San José" required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Ciudad (opcional)
                </label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  className={INPUT} placeholder="Tegucigalpa" />
              </div>

              {/* Resumen rubro */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-100">
                <span className="material-symbols-outlined text-teal-600 text-[20px] shrink-0">
                  {selectedRubro?.icon}
                </span>
                <div>
                  <p className="text-teal-800 text-sm font-semibold">{selectedRubro?.label}</p>
                  <p className="text-teal-600 text-xs">El bot IA se configurará para esta especialidad</p>
                </div>
                <button type="button" onClick={() => setStep(1)}
                  className="ml-auto text-teal-500 text-xs hover:text-teal-700 underline shrink-0">
                  Cambiar
                </button>
              </div>

              <button type="submit" disabled={loading || !clinicName.trim()}
                className="w-full rounded-xl bg-teal-600 text-white py-3 font-semibold text-sm hover:bg-teal-500 transition-colors disabled:opacity-50 mt-2">
                {loading ? "Creando tu clínica..." : "Crear mi clínica y empezar"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          14 días de prueba gratis · Sin tarjeta · Cancela cuando quieras
        </p>
      </div>
    </div>
  );
}
