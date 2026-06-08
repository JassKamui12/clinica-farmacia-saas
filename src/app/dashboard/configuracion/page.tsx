'use client';

import { useEffect, useState } from "react";

interface ClinicConfig {
  id: string;
  name: string;
  rubroId: string;
  slug: string;
  plan: string;
  trialEndsAt: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  waMode: string;
  waPhoneNumberId: string | null;
  waAccessToken: string | null;
  hasWaAccessToken: boolean;
  aiName: string;
  aiSystemPrompt: string | null;
  whatsappPhone: string | null;
}

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:opacity-50";

export default function ConfiguracionPage() {
  const [clinic, setClinic] = useState<ClinicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [waStatus, setWaStatus] = useState<{ connected: boolean; phone?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"clinica" | "whatsapp" | "ia">("clinica");

  useEffect(() => {
    fetch("/api/clinic")
      .then((r) => r.json())
      .then(setClinic)
      .finally(() => setLoading(false));

    fetch("/api/whatsapp/baileys?action=status")
      .then((r) => r.json())
      .then(setWaStatus)
      .catch(() => null);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!clinic) return;
    setSaving(true); setSaved(false);
    await fetch("/api/clinic", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clinic),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto animate-pulse space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
    </div>
  );

  if (!clinic) return null;

  const TABS = [
    { key: "clinica",   label: "Clínica",    icon: "business" },
    { key: "whatsapp",  label: "WhatsApp",   icon: "chat" },
    { key: "ia",        label: "Bot IA",     icon: "smart_toy" },
  ] as const;

  const trialDaysLeft = clinic.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(clinic.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">{clinic.name}</p>
      </div>

      {/* Plan badge */}
      {clinic.plan === "trial" && trialDaysLeft !== null && (
        <div className={`mb-6 rounded-2xl px-5 py-4 flex items-center gap-3 ${trialDaysLeft <= 3 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
          <span className={`material-symbols-outlined text-2xl shrink-0 ${trialDaysLeft <= 3 ? "text-red-500" : "text-amber-500"}`}>hourglass_top</span>
          <div>
            <p className={`font-semibold text-sm ${trialDaysLeft <= 3 ? "text-red-800" : "text-amber-800"}`}>
              Período de prueba — {trialDaysLeft} día{trialDaysLeft !== 1 ? "s" : ""} restante{trialDaysLeft !== 1 ? "s" : ""}
            </p>
            <p className={`text-xs mt-0.5 ${trialDaysLeft <= 3 ? "text-red-600" : "text-amber-600"}`}>
              Suscríbete para mantener acceso completo al finalizar el trial.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-[#051125] text-[#051125]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {activeTab === "clinica" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Nombre de la clínica</label>
              <input type="text" value={clinic.name} onChange={(e) => setClinic({ ...clinic, name: e.target.value })} className={INPUT} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Tipo de clínica</label>
              <input type="text" value={clinic.rubroId.replace(/-/g, " ")} className={INPUT} disabled />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Slug WhatsApp</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 shrink-0">Bot: </span>
                <input type="text" value={clinic.slug} className={INPUT} disabled />
              </div>
              <p className="text-xs text-slate-400 mt-1">Los pacientes activan el bot enviando este código por WhatsApp</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Ciudad</label>
                <input type="text" value={clinic.city ?? ""} onChange={(e) => setClinic({ ...clinic, city: e.target.value })} className={INPUT} placeholder="Tegucigalpa" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Teléfono</label>
                <input type="text" value={clinic.phone ?? ""} onChange={(e) => setClinic({ ...clinic, phone: e.target.value })} className={INPUT} placeholder="+504 2234-5678" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Dirección</label>
              <input type="text" value={clinic.address ?? ""} onChange={(e) => setClinic({ ...clinic, address: e.target.value })} className={INPUT} placeholder="Col. Lomas del Guijarro, Tegucigalpa" />
            </div>
          </div>
        )}

        {activeTab === "whatsapp" && (
          <div className="space-y-4">
            {/* Estado de conexión Baileys */}
            <div className={`rounded-2xl p-4 flex items-center gap-3 ${waStatus?.connected ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-200"}`}>
              <span className={`w-3 h-3 rounded-full shrink-0 ${waStatus?.connected ? "bg-emerald-400" : "bg-slate-300"}`} />
              <div>
                <p className="font-semibold text-sm text-slate-900">
                  {waStatus?.connected ? "WhatsApp conectado" : "WhatsApp desconectado"}
                </p>
                {waStatus?.phone && <p className="text-xs text-slate-500">{waStatus.phone}</p>}
                {!waStatus?.connected && <p className="text-xs text-slate-500">Vincula tu número desde el botón de abajo</p>}
              </div>
              {!waStatus?.connected && (
                <a href="#qr" className="ml-auto shrink-0 rounded-xl bg-[#051125] text-white text-xs font-semibold px-4 py-2 hover:bg-[#1b263b] transition-colors">
                  Conectar
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Modo WhatsApp</label>
              <select value={clinic.waMode} onChange={(e) => setClinic({ ...clinic, waMode: e.target.value })} className={INPUT}>
                <option value="BAILEYS">Baileys (número propio)</option>
                <option value="META">Meta Cloud API</option>
              </select>
            </div>

            {clinic.waMode === "META" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Phone Number ID (Meta)</label>
                  <input type="text" value={clinic.waPhoneNumberId ?? ""} onChange={(e) => setClinic({ ...clinic, waPhoneNumberId: e.target.value })} className={INPUT} placeholder="123456789012345" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Access Token {clinic.hasWaAccessToken && <span className="text-emerald-600">(configurado)</span>}
                  </label>
                  <input type="password" value={clinic.waAccessToken ?? ""} onChange={(e) => setClinic({ ...clinic, waAccessToken: e.target.value })} className={INPUT} placeholder={clinic.hasWaAccessToken ? "••••••••" : "EAAxxxxx..."} />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "ia" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Nombre del asistente IA</label>
              <input type="text" value={clinic.aiName} onChange={(e) => setClinic({ ...clinic, aiName: e.target.value })} className={INPUT} placeholder="Asistente Médico" />
              <p className="text-xs text-slate-400 mt-1">Este nombre usará el bot cuando se presente a los pacientes</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Instrucciones personalizadas (System Prompt)</label>
              <textarea
                value={clinic.aiSystemPrompt ?? ""}
                onChange={(e) => setClinic({ ...clinic, aiSystemPrompt: e.target.value })}
                className={`${INPUT} resize-none`}
                rows={6}
                placeholder="Instrucciones específicas para tu clínica. Ej: Solo agenda citas de lunes a viernes. Avisar que el precio de consulta es L 300..."
              />
              <p className="text-xs text-slate-400 mt-1">Se agrega al prompt base del sistema. Déjalo vacío para usar el prompt estándar del rubro.</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#051125] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#1b263b] transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Guardado
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
