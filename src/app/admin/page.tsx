'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";

interface Stats {
  users: number; patients: number; visits: number; prescriptions: number;
  appointments: number; followups: number; products: number; whatsappMessages: number; alerts: number;
}
interface WhatsAppMessage {
  id: string; phone: string; direction: string; body?: string | null;
  messageType: string; status: string; intent?: string | null; createdAt: string;
  patient?: { name: string } | null;
}
interface Notification {
  id: string; title: string; content: string; role?: string | null; read: boolean; createdAt: string;
}
interface ClinicConfig {
  id: string; name: string; type: string; slug: string;
  address?: string | null; city?: string | null; country: string; phone?: string | null;
  waPhoneNumberId?: string | null; waVerifyToken?: string | null; waAccessToken?: string | null;
  hasWaAccessToken: boolean;
  aiProvider?: string | null; aiModel?: string | null; aiName: string;
  aiSystemPrompt?: string | null; aiApiKey?: string | null; hasAiApiKey: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic Claude", groq: "Groq (Llama)", openai: "OpenAI", deepseek: "DeepSeek",
};
const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-7"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
};

const INPUT = "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({ users: 0, patients: 0, visits: 0, prescriptions: 0, appointments: 0, followups: 0, products: 0, whatsappMessages: 0, alerts: 0 });
  const [recentMessages, setRecentMessages] = useState<WhatsAppMessage[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "whatsapp" | "clinic" | "ai">("overview");

  const [clinic, setClinic] = useState<ClinicConfig | null>(null);
  const [clinicForm, setClinicForm] = useState<Partial<ClinicConfig>>({});
  const [waTokenInput, setWaTokenInput] = useState("");
  const [aiKeyInput, setAiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiRole, setAiRole] = useState("doctor");
  const [aiResponse, setAiResponse] = useState("");

  const loadData = useCallback(async () => {
    const [usersRes, patientsRes, visitsRes, rxRes, apptsRes, fuRes, prodsRes, msgsRes, notifsRes] = await Promise.all([
      fetch("/api/users"), fetch("/api/patients"), fetch("/api/visits"),
      fetch("/api/prescriptions"), fetch("/api/appointments"),
      fetch("/api/followups?status=ACTIVE"), fetch("/api/products"),
      fetch("/api/whatsapp/messages?limit=10"), fetch("/api/notifications"),
    ]);
    const [users, patients, visits, rx, appts, fu, prods, msgs, notifs] = await Promise.all([
      usersRes.json(), patientsRes.json(), visitsRes.json(), rxRes.json(),
      apptsRes.json(), fuRes.json(), prodsRes.json(), msgsRes.json(), notifsRes.json(),
    ]);
    setStats({ users: users.length, patients: patients.length, visits: visits.length, prescriptions: rx.length, appointments: appts.length, followups: fu.length, products: prods.length, whatsappMessages: msgs.length, alerts: fu.filter((f: any) => f.alertTriggered).length });
    setRecentMessages(msgs);
    setRecentNotifications(notifs.slice(0, 5));
  }, []);

  const loadClinic = useCallback(async () => {
    const res = await fetch("/api/clinic");
    if (res.ok) { const data: ClinicConfig = await res.json(); setClinic(data); setClinicForm(data); }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { loadData(); loadClinic(); }
  }, [status]);

  async function saveClinic() {
    setSaving(true); setSaveMsg("");
    const body: Record<string, unknown> = { ...clinicForm };
    if (waTokenInput.trim()) body.waAccessToken = waTokenInput.trim();
    if (aiKeyInput.trim()) body.aiApiKey = aiKeyInput.trim();
    const res = await fetch("/api/clinic", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setSaveMsg("Configuración guardada correctamente"); setWaTokenInput(""); setAiKeyInput(""); loadClinic(); }
    else { const err = await res.json(); setSaveMsg(err.error || "Error al guardar"); }
    setSaving(false); setTimeout(() => setSaveMsg(""), 4000);
  }

  async function testAi() {
    if (!aiPrompt.trim()) return;
    setAiResponse("Consultando IA...");
    const endpoint = aiRole === "doctor" ? "/api/ai/diagnose" : "/api/ai/pharmacy";
    const body = aiRole === "doctor"
      ? { patientName: "Paciente", symptoms: aiPrompt, availableMedications: [] }
      : { customerDescription: aiPrompt, availableMedications: [] };
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setAiResponse(data.text || data.response || "Sin respuesta");
  }

  if (status === "loading") return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/admin" userRole={(session?.user.role ?? "ADMIN") as AppRole} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
            <p className="text-slate-500 text-sm mt-1">Métricas, configuración de clínica, IA y WhatsApp</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-2 flex-wrap">
            {[
              { key: "overview", label: "General",    icon: "dashboard" },
              { key: "clinic",   label: "Clínica & IA", icon: "local_hospital" },
              { key: "whatsapp", label: "WhatsApp",   icon: "chat" },
              { key: "ai",       label: "Probar IA",  icon: "smart_toy" },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === "overview" && (
            <>
              <div className="grid gap-4 lg:grid-cols-5">
                {[
                  { label: "Usuarios",   value: stats.users,         color: "text-blue-600" },
                  { label: "Pacientes",  value: stats.patients,      color: "text-emerald-600" },
                  { label: "Consultas",  value: stats.visits,        color: "text-violet-600" },
                  { label: "Citas",      value: stats.appointments,  color: "text-slate-900" },
                  { label: "Recetas",    value: stats.prescriptions, color: "text-amber-600" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                {[
                  { label: "Productos",     value: stats.products,         color: "text-slate-900",   bg: "bg-white",       border: "border-slate-200" },
                  { label: "Mensajes WA",   value: stats.whatsappMessages, color: "text-[#25D366]",   bg: "bg-emerald-50",  border: "border-emerald-200" },
                  { label: "Seguimientos",  value: stats.followups,        color: "text-blue-600",    bg: "bg-blue-50",     border: "border-blue-200" },
                  { label: "Alertas",       value: stats.alerts,           color: "text-red-600",     bg: "bg-red-50",      border: "border-red-200" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-5`}>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#25D366]">chat</span>
                    <h2 className="text-base font-semibold text-slate-900">Actividad WhatsApp</h2>
                  </div>
                  {recentMessages.length === 0 ? (
                    <p className="text-slate-400 text-center py-8 text-sm">Sin mensajes aún</p>
                  ) : (
                    <div className="space-y-2">
                      {recentMessages.map((msg) => (
                        <div key={msg.id} className={`rounded-xl border p-3 ${msg.direction === "INBOUND" ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-xs ${msg.direction === "INBOUND" ? "text-[#25D366]" : "text-blue-500"}`}>
                                {msg.direction === "INBOUND" ? "call_received" : "call_made"}
                              </span>
                              <span className="text-sm font-medium text-slate-800">{msg.patient?.name || msg.phone}</span>
                            </div>
                            <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {msg.body && <p className="text-xs text-slate-500 mt-1 truncate">{msg.body}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-slate-900 mb-4">Notificaciones</h2>
                  {recentNotifications.length === 0 ? (
                    <p className="text-slate-400 text-center py-8 text-sm">Sin notificaciones</p>
                  ) : (
                    <div className="space-y-2">
                      {recentNotifications.map((n) => (
                        <div key={n.id} className={`rounded-xl border p-3 ${n.read ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-200"}`}>
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{n.content}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString("es-HN")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  { href: "/appointments", icon: "calendar_month", color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    title: "Gestionar Citas",  desc: "Programación y seguimiento" },
                  { href: "/followups",    icon: "monitor_heart",  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", title: "Seguimientos",     desc: "Adherencia y alertas" },
                  { href: "/whatsapp",     icon: "chat",           color: "text-[#25D366]",   bg: "bg-emerald-50", border: "border-emerald-200", title: "WhatsApp",         desc: "Conversaciones con pacientes" },
                ].map((card) => (
                  <Link key={card.href} href={card.href} className={`bg-white rounded-2xl border ${card.border} shadow-sm p-6 hover:shadow-md transition-all group`}>
                    <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                      <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
                    </div>
                    <p className="font-semibold text-slate-900">{card.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{card.desc}</p>
                    <p className={`text-xs font-medium mt-3 ${card.color} group-hover:underline`}>Abrir →</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Clinic & AI config */}
          {activeTab === "clinic" && clinic && (
            <div className="space-y-6">
              {saveMsg && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${saveMsg.includes("Error") || saveMsg.includes("error") ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                  {saveMsg}
                </div>
              )}

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">local_hospital</span>
                  <h2 className="text-lg font-bold text-slate-900">Información de la Clínica</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Nombre</label>
                    <input value={clinicForm.name ?? ""} onChange={(e) => setClinicForm((p) => ({ ...p, name: e.target.value }))} className={INPUT} /></div>
                  <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Tipo</label>
                    <select value={clinicForm.type ?? "MEDICAL"} onChange={(e) => setClinicForm((p) => ({ ...p, type: e.target.value }))} className={INPUT}>
                      <option value="MEDICAL">Clínica Médica</option>
                      <option value="DENTAL">Clínica Dental</option>
                      <option value="PHARMACY">Farmacia</option>
                      <option value="COMBINED">Clínica + Farmacia</option>
                    </select></div>
                  <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Teléfono</label>
                    <input value={clinicForm.phone ?? ""} onChange={(e) => setClinicForm((p) => ({ ...p, phone: e.target.value }))} className={INPUT} /></div>
                  <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Ciudad</label>
                    <input value={clinicForm.city ?? ""} onChange={(e) => setClinicForm((p) => ({ ...p, city: e.target.value }))} className={INPUT} /></div>
                  <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Dirección</label>
                    <input value={clinicForm.address ?? ""} onChange={(e) => setClinicForm((p) => ({ ...p, address: e.target.value }))} className={INPUT} /></div>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#25D366]">chat</span>
                  <h2 className="text-lg font-bold text-slate-900">Configuración WhatsApp</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Phone Number ID (Meta)</label>
                    <input value={clinicForm.waPhoneNumberId ?? ""} onChange={(e) => setClinicForm((p) => ({ ...p, waPhoneNumberId: e.target.value }))} placeholder="975658988973836" className={INPUT} /></div>
                  <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Verify Token</label>
                    <input value={clinicForm.waVerifyToken ?? ""} onChange={(e) => setClinicForm((p) => ({ ...p, waVerifyToken: e.target.value }))} placeholder="mi-token-secreto" className={INPUT} /></div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                      Access Token {clinic.hasWaAccessToken && <span className="ml-2 text-emerald-600">✓ Configurado</span>}
                    </label>
                    <input value={waTokenInput} onChange={(e) => setWaTokenInput(e.target.value)} type="password" placeholder={clinic.hasWaAccessToken ? "Dejar vacío para mantener el actual" : "EAI..."} className={INPUT} />
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-600 mb-1">Webhook URL para Meta Developers</p>
                  <code className="text-xs text-emerald-700 break-all">{typeof window !== "undefined" ? window.location.origin : ""}/api/whatsapp/webhook</code>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-violet-600">smart_toy</span>
                  <h2 className="text-lg font-bold text-slate-900">Configuración de IA para WhatsApp</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => setClinicForm((p) => ({ ...p, aiProvider: key, aiModel: PROVIDER_MODELS[key][0] }))}
                      className={`rounded-xl border p-4 text-left transition-all ${clinicForm.aiProvider === key ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/50"}`}>
                      <p className="text-sm font-semibold text-slate-900">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{key}</p>
                    </button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Modelo</label>
                    <select value={clinicForm.aiModel ?? ""} onChange={(e) => setClinicForm((p) => ({ ...p, aiModel: e.target.value }))} className={INPUT}>
                      {(PROVIDER_MODELS[clinicForm.aiProvider ?? "anthropic"] ?? []).map((m) => <option key={m} value={m}>{m}</option>)}
                    </select></div>
                  <div><label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Nombre del asistente</label>
                    <input value={clinicForm.aiName ?? ""} onChange={(e) => setClinicForm((p) => ({ ...p, aiName: e.target.value }))} placeholder="Asistente" className={INPUT} /></div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                      API Key del proveedor {clinic.hasAiApiKey && <span className="ml-2 text-violet-600">✓ Configurada</span>}
                    </label>
                    <input value={aiKeyInput} onChange={(e) => setAiKeyInput(e.target.value)} type="password" placeholder={clinic.hasAiApiKey ? "Dejar vacío para mantener la actual" : "sk-ant-... / gsk_... / sk-..."} className={INPUT} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                      Prompt del sistema personalizado <span className="text-slate-400 normal-case font-normal">(opcional — usa {`{{clinicName}}`} y {`{{aiName}}`})</span>
                    </label>
                    <textarea value={clinicForm.aiSystemPrompt ?? ""} onChange={(e) => setClinicForm((p) => ({ ...p, aiSystemPrompt: e.target.value }))} placeholder="Dejar vacío para usar el prompt predeterminado..." rows={5} className={`${INPUT} resize-none`} />
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button onClick={saveClinic} disabled={saving} className="rounded-xl bg-blue-600 text-white font-semibold px-8 py-3 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm shadow-blue-600/20">
                  {saving ? "Guardando..." : "Guardar configuración"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "clinic" && !clinic && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8 text-center">
              <span className="material-symbols-outlined text-amber-600 text-4xl mb-3 block">warning</span>
              <p className="text-amber-800 font-medium">Tu usuario no está asignado a ninguna clínica</p>
              <p className="text-slate-500 text-sm mt-2">Contacta al superadministrador para que te asigne una clínica.</p>
            </div>
          )}

          {/* WhatsApp info */}
          {activeTab === "whatsapp" && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900">Guía de Configuración WhatsApp</h2>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Webhook URL</p>
                <code className="text-xs text-emerald-700 break-all">{typeof window !== "undefined" ? window.location.origin : ""}/api/whatsapp/webhook</code>
                <p className="text-xs text-slate-500 mt-2">Configura esta URL en Meta Developers → Webhooks → Editar</p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-4">Capacidades de la IA por WhatsApp</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { icon: "calendar_month",         color: "text-blue-600",    bg: "bg-blue-50",    title: "Agendar cita",       desc: "El paciente solicita fecha y hora, la IA crea la cita automáticamente" },
                    { icon: "event_note",             color: "text-emerald-600", bg: "bg-emerald-50", title: "Consultar cita",     desc: "El paciente consulta su próxima cita con nombre del doctor" },
                    { icon: "monitor_heart",          color: "text-violet-600",  bg: "bg-violet-50",  title: "Seguimiento",        desc: "Check-in de tratamiento y adherencia con puntaje automático" },
                    { icon: "medication",             color: "text-[#25D366]",   bg: "bg-emerald-50", title: "Consulta farmacia",  desc: "Preguntas sobre medicamentos, precios y disponibilidad" },
                    { icon: "warning",                color: "text-amber-600",   bg: "bg-amber-50",   title: "Alertas médicas",    desc: "Detección de síntomas graves y notificación automática al doctor" },
                    { icon: "person",                 color: "text-slate-600",   bg: "bg-slate-100",  title: "Modo manual",        desc: "El staff toma el control; la IA se pausa automáticamente 5 minutos" },
                  ].map((f) => (
                    <div key={f.title} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                      <div className={`w-8 h-8 ${f.bg} rounded-lg flex items-center justify-center mb-2`}>
                        <span className={`material-symbols-outlined text-sm ${f.color}`}>{f.icon}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/whatsapp" className="rounded-xl bg-[#25D366] text-white font-semibold px-6 py-2.5 text-sm hover:bg-[#20bd5a] transition-colors">
                  Ver conversaciones →
                </Link>
              </div>
            </section>
          )}

          {/* AI test */}
          {activeTab === "ai" && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900">Probar Asistente IA</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Rol</label>
                    <select value={aiRole} onChange={(e) => setAiRole(e.target.value)} className={INPUT}>
                      <option value="doctor">Doctor (Diagnóstico)</option>
                      <option value="pharmacist">Farmacéutico (Sugerencia)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Consulta</label>
                    <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder={aiRole === "doctor" ? "Describe los síntomas del paciente..." : "Describe la consulta del cliente..."} rows={5} className={`${INPUT} resize-none`} />
                  </div>
                  <button onClick={testAi} disabled={!aiPrompt.trim()} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50">
                    Consultar IA
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Respuesta</label>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 min-h-[200px]">
                    {aiResponse ? (
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{aiResponse}</p>
                    ) : (
                      <p className="text-sm text-slate-400">La respuesta de la IA aparecerá aquí...</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
