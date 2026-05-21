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
  id: string; title: string; content: string; role?: string | null;
  read: boolean; createdAt: string;
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
  anthropic: "Anthropic Claude",
  groq: "Groq (Llama)",
  openai: "OpenAI",
  deepseek: "DeepSeek",
};

const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-7"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    users: 0, patients: 0, visits: 0, prescriptions: 0, appointments: 0,
    followups: 0, products: 0, whatsappMessages: 0, alerts: 0,
  });
  const [recentMessages, setRecentMessages] = useState<WhatsAppMessage[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "whatsapp" | "clinic" | "ai">("overview");

  // Clinic config state
  const [clinic, setClinic] = useState<ClinicConfig | null>(null);
  const [clinicForm, setClinicForm] = useState<Partial<ClinicConfig>>({});
  const [waTokenInput, setWaTokenInput] = useState("");
  const [aiKeyInput, setAiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // AI prompt test
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiRole, setAiRole] = useState("doctor");
  const [aiResponse, setAiResponse] = useState("");

  const loadData = useCallback(async () => {
    const [usersRes, patientsRes, visitsRes, rxRes, apptsRes, fuRes, prodsRes, msgsRes, notifsRes] =
      await Promise.all([
        fetch("/api/users"), fetch("/api/patients"), fetch("/api/visits"),
        fetch("/api/prescriptions"), fetch("/api/appointments"),
        fetch("/api/followups?status=ACTIVE"), fetch("/api/products"),
        fetch("/api/whatsapp/messages?limit=10"), fetch("/api/notifications"),
      ]);

    const users = await usersRes.json();
    const patients = await patientsRes.json();
    const visits = await visitsRes.json();
    const rx = await rxRes.json();
    const appts = await apptsRes.json();
    const fu = await fuRes.json();
    const prods = await prodsRes.json();
    const msgs = await msgsRes.json();
    const notifs = await notifsRes.json();

    setStats({
      users: users.length, patients: patients.length, visits: visits.length,
      prescriptions: rx.length, appointments: appts.length,
      followups: fu.length, products: prods.length,
      whatsappMessages: msgs.length,
      alerts: fu.filter((f: any) => f.alertTriggered).length,
    });

    setRecentMessages(msgs);
    setRecentNotifications(notifs.slice(0, 5));
  }, []);

  const loadClinic = useCallback(async () => {
    const res = await fetch("/api/clinic");
    if (res.ok) {
      const data: ClinicConfig = await res.json();
      setClinic(data);
      setClinicForm(data);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      loadData();
      loadClinic();
    }
  }, [status]);

  async function saveClinic() {
    setSaving(true);
    setSaveMsg("");
    const body: Record<string, unknown> = { ...clinicForm };
    if (waTokenInput.trim()) body.waAccessToken = waTokenInput.trim();
    if (aiKeyInput.trim()) body.aiApiKey = aiKeyInput.trim();
    const res = await fetch("/api/clinic", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setSaveMsg("Configuración guardada correctamente");
      setWaTokenInput("");
      setAiKeyInput("");
      loadClinic();
    } else {
      const err = await res.json();
      setSaveMsg(err.error || "Error al guardar");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 4000);
  }

  async function testAi() {
    if (!aiPrompt.trim()) return;
    setAiResponse("Consultando IA...");
    const endpoint = aiRole === "doctor" ? "/api/ai/diagnose" : "/api/ai/pharmacy";
    const body = aiRole === "doctor"
      ? { patientName: "Paciente", symptoms: aiPrompt, availableMedications: [] }
      : { customerDescription: aiPrompt, availableMedications: [] };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setAiResponse(data.text || data.response || "Sin respuesta");
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar
        activePath="/admin"
        userRole={(session?.user.role ?? "ADMIN") as AppRole}
        userName={session?.user.name}
        userEmail={session?.user.email}
      />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Panel de Administración</h1>
            <p className="text-slate-500 mt-1">Métricas, configuración de clínica, IA y WhatsApp</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "overview", label: "General", icon: "dashboard" },
              { key: "clinic", label: "Clínica & IA", icon: "local_hospital" },
              { key: "whatsapp", label: "WhatsApp", icon: "chat" },
              { key: "ai", label: "Probar IA", icon: "smart_toy" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "bg-[#00F5A0] text-[#0A0C10]"
                    : "border border-[#30363D] text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Overview tab ───────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <>
              <div className="grid gap-4 lg:grid-cols-5">
                {[
                  { label: "Usuarios", value: stats.users, color: "text-[#00F5A0]" },
                  { label: "Pacientes", value: stats.patients, color: "text-[#00D9FF]" },
                  { label: "Consultas", value: stats.visits, color: "text-purple-400" },
                  { label: "Citas", value: stats.appointments, color: "text-pink-400" },
                  { label: "Recetas", value: stats.prescriptions, color: "text-amber-400" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                    <p className="text-xs uppercase tracking-widest text-slate-500">{s.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                {[
                  { label: "Productos", value: stats.products, color: "text-slate-100", border: "border-[#30363D]" },
                  { label: "Mensajes WA", value: stats.whatsappMessages, color: "text-[#25D366]", border: "border-[#25D366]/30" },
                  { label: "Seguimientos", value: stats.followups, color: "text-cyan-400", border: "border-[#30363D]" },
                  { label: "Alertas", value: stats.alerts, color: "text-red-400", border: "border-red-400/30", bg: "bg-red-400/5" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg ?? "bg-[#161B22]"} p-5`}>
                    <p className="text-xs uppercase tracking-widest text-slate-500">{s.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#25D366]">chat</span>
                    <h2 className="text-lg font-semibold text-slate-100">Actividad WhatsApp</h2>
                  </div>
                  {recentMessages.length === 0 ? (
                    <p className="text-slate-500 text-center py-8 text-sm">Sin mensajes aún</p>
                  ) : (
                    <div className="space-y-2">
                      {recentMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`rounded-xl border p-3 ${
                            msg.direction === "INBOUND"
                              ? "bg-[#25D366]/5 border-[#25D366]/20"
                              : "bg-[#0A0C10] border-[#30363D]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-xs ${msg.direction === "INBOUND" ? "text-[#25D366]" : "text-[#00D9FF]"}`}>
                                {msg.direction === "INBOUND" ? "call_received" : "call_made"}
                              </span>
                              <span className="text-sm text-slate-300">{msg.patient?.name || msg.phone}</span>
                            </div>
                            <span className="text-xs text-slate-600">
                              {new Date(msg.createdAt).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {msg.body && <p className="text-xs text-slate-400 mt-1 truncate">{msg.body}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
                  <h2 className="text-lg font-semibold text-slate-100 mb-4">Notificaciones</h2>
                  {recentNotifications.length === 0 ? (
                    <p className="text-slate-500 text-center py-8 text-sm">Sin notificaciones</p>
                  ) : (
                    <div className="space-y-2">
                      {recentNotifications.map((n) => (
                        <div
                          key={n.id}
                          className={`rounded-xl border p-3 ${
                            n.read ? "bg-[#0A0C10] border-[#30363D]" : "bg-[#00F5A0]/5 border-[#00F5A0]/20"
                          }`}
                        >
                          <p className="text-sm font-medium text-slate-100">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{n.content}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {new Date(n.createdAt).toLocaleString("es-HN")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  { href: "/appointments", icon: "calendar_month", color: "#00F5A0", title: "Gestionar Citas", desc: "Programación y seguimiento" },
                  { href: "/followups", icon: "monitor_heart", color: "#00D9FF", title: "Seguimientos", desc: "Adherencia y alertas" },
                  { href: "/whatsapp", icon: "chat", color: "#25D366", title: "WhatsApp", desc: "Conversaciones con pacientes" },
                ].map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-opacity-50 transition-colors group"
                    style={{ "--hover-color": card.color } as any}
                  >
                    <span className="material-symbols-outlined text-2xl" style={{ color: card.color }}>{card.icon}</span>
                    <h3 className="text-lg font-semibold text-slate-100 mt-3">{card.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{card.desc}</p>
                    <p className="text-xs mt-3 group-hover:underline" style={{ color: card.color }}>Abrir →</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* ── Clinic & AI config tab ─────────────────────────────────── */}
          {activeTab === "clinic" && clinic && (
            <div className="space-y-6">
              {saveMsg && (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${
                  saveMsg.includes("Error") || saveMsg.includes("error")
                    ? "border-red-400/30 bg-red-400/10 text-red-400"
                    : "border-[#00F5A0]/30 bg-[#00F5A0]/10 text-[#00F5A0]"
                }`}>
                  {saveMsg}
                </div>
              )}

              {/* Clinic info */}
              <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00F5A0]">local_hospital</span>
                  <h2 className="text-xl font-semibold text-slate-100">Información de la Clínica</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Nombre</label>
                    <input
                      value={clinicForm.name ?? ""}
                      onChange={(e) => setClinicForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Tipo</label>
                    <select
                      value={clinicForm.type ?? "MEDICAL"}
                      onChange={(e) => setClinicForm((p) => ({ ...p, type: e.target.value }))}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
                    >
                      <option value="MEDICAL">Clínica Médica</option>
                      <option value="DENTAL">Clínica Dental</option>
                      <option value="PHARMACY">Farmacia</option>
                      <option value="COMBINED">Clínica + Farmacia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Teléfono</label>
                    <input
                      value={clinicForm.phone ?? ""}
                      onChange={(e) => setClinicForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Ciudad</label>
                    <input
                      value={clinicForm.city ?? ""}
                      onChange={(e) => setClinicForm((p) => ({ ...p, city: e.target.value }))}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1.5">Dirección</label>
                    <input
                      value={clinicForm.address ?? ""}
                      onChange={(e) => setClinicForm((p) => ({ ...p, address: e.target.value }))}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
                    />
                  </div>
                </div>
              </section>

              {/* WhatsApp config */}
              <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#25D366]">chat</span>
                  <h2 className="text-xl font-semibold text-slate-100">Configuración WhatsApp</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Phone Number ID (Meta)</label>
                    <input
                      value={clinicForm.waPhoneNumberId ?? ""}
                      onChange={(e) => setClinicForm((p) => ({ ...p, waPhoneNumberId: e.target.value }))}
                      placeholder="975658988973836"
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#25D366]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Verify Token</label>
                    <input
                      value={clinicForm.waVerifyToken ?? ""}
                      onChange={(e) => setClinicForm((p) => ({ ...p, waVerifyToken: e.target.value }))}
                      placeholder="mi-token-secreto"
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#25D366]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1.5">
                      Access Token
                      {clinic.hasWaAccessToken && (
                        <span className="ml-2 text-[#25D366]">✓ Configurado</span>
                      )}
                    </label>
                    <input
                      value={waTokenInput}
                      onChange={(e) => setWaTokenInput(e.target.value)}
                      type="password"
                      placeholder={clinic.hasWaAccessToken ? "Dejar vacío para mantener el actual" : "EAI..."}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#25D366]"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-4">
                  <p className="text-xs font-medium text-slate-400 mb-1">Webhook URL para Meta Developers</p>
                  <code className="text-xs text-[#25D366] break-all">
                    {typeof window !== "undefined" ? window.location.origin : ""}/api/whatsapp/webhook
                  </code>
                </div>
              </section>

              {/* AI config */}
              <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-400">smart_toy</span>
                  <h2 className="text-xl font-semibold text-slate-100">Configuración de IA para WhatsApp</h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setClinicForm((p) => ({
                        ...p,
                        aiProvider: key,
                        aiModel: PROVIDER_MODELS[key][0],
                      }))}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        clinicForm.aiProvider === key
                          ? "border-purple-400 bg-purple-400/10"
                          : "border-[#30363D] hover:border-[#30363D] hover:bg-[#0A0C10]"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-100">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{key}</p>
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Modelo</label>
                    <select
                      value={clinicForm.aiModel ?? ""}
                      onChange={(e) => setClinicForm((p) => ({ ...p, aiModel: e.target.value }))}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-400"
                    >
                      {(PROVIDER_MODELS[clinicForm.aiProvider ?? "anthropic"] ?? []).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Nombre del asistente</label>
                    <input
                      value={clinicForm.aiName ?? ""}
                      onChange={(e) => setClinicForm((p) => ({ ...p, aiName: e.target.value }))}
                      placeholder="Asistente"
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1.5">
                      API Key del proveedor
                      {clinic.hasAiApiKey && (
                        <span className="ml-2 text-purple-400">✓ Configurada</span>
                      )}
                    </label>
                    <input
                      value={aiKeyInput}
                      onChange={(e) => setAiKeyInput(e.target.value)}
                      type="password"
                      placeholder={clinic.hasAiApiKey ? "Dejar vacío para mantener la actual" : "sk-ant-... / gsk_... / sk-..."}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1.5">
                      Prompt del sistema personalizado{" "}
                      <span className="text-slate-600">(opcional — usa {`{{clinicName}}`} y {`{{aiName}}`})</span>
                    </label>
                    <textarea
                      value={clinicForm.aiSystemPrompt ?? ""}
                      onChange={(e) => setClinicForm((p) => ({ ...p, aiSystemPrompt: e.target.value }))}
                      placeholder="Dejar vacío para usar el prompt predeterminado..."
                      rows={5}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-400 resize-none"
                    />
                    <p className="text-xs text-slate-600 mt-1">
                      Si se define, reemplaza completamente el prompt de la IA para WhatsApp de esta clínica.
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  onClick={saveClinic}
                  disabled={saving}
                  className="rounded-xl bg-[#00F5A0] text-[#0A0C10] font-semibold px-8 py-3 text-sm hover:bg-[#00d986] transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar configuración"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "clinic" && !clinic && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-8 text-center">
              <span className="material-symbols-outlined text-amber-400 text-4xl mb-3 block">warning</span>
              <p className="text-amber-300 font-medium">Tu usuario no está asignado a ninguna clínica</p>
              <p className="text-slate-500 text-sm mt-2">Contacta al superadministrador para que te asigne una clínica.</p>
            </div>
          )}

          {/* ── WhatsApp info tab ──────────────────────────────────────── */}
          {activeTab === "whatsapp" && (
            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-6">
              <h2 className="text-xl font-semibold text-slate-100">Guía de Configuración WhatsApp</h2>

              <div className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-4">
                <p className="text-sm font-medium text-slate-300 mb-2">Webhook URL</p>
                <code className="text-xs text-[#00F5A0] break-all">
                  {typeof window !== "undefined" ? window.location.origin : ""}/api/whatsapp/webhook
                </code>
                <p className="text-xs text-slate-500 mt-2">
                  Configura esta URL en Meta Developers → Webhooks → Editar
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Capacidades de la IA por WhatsApp</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { icon: "calendar_month", color: "#00F5A0", title: "Agendar cita", desc: "El paciente solicita fecha y hora, la IA crea la cita automáticamente" },
                    { icon: "event_note", color: "#00D9FF", title: "Consultar cita", desc: "El paciente consulta su próxima cita con nombre del doctor" },
                    { icon: "monitor_heart", color: "purple", title: "Seguimiento", desc: "Check-in de tratamiento y adherencia con puntaje automático" },
                    { icon: "medication", color: "#25D366", title: "Consulta farmacia", desc: "Preguntas sobre medicamentos, precios y disponibilidad" },
                    { icon: "warning", color: "#f59e0b", title: "Alertas médicas", desc: "Detección de síntomas graves y notificación automática al doctor" },
                    { icon: "person", color: "#e879f9", title: "Modo manual", desc: "El staff toma el control; la IA se pausa automáticamente 5 minutos" },
                  ].map((f) => (
                    <div key={f.title} className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-4">
                      <span className="material-symbols-outlined mb-2 block" style={{ color: f.color }}>{f.icon}</span>
                      <p className="text-sm font-semibold text-slate-200">{f.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/whatsapp"
                  className="rounded-xl bg-[#25D366] text-white font-semibold px-6 py-2.5 text-sm hover:bg-[#20bd5a] transition-colors"
                >
                  Ver conversaciones →
                </Link>
              </div>
            </section>
          )}

          {/* ── AI test tab ────────────────────────────────────────────── */}
          {activeTab === "ai" && (
            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-6">
              <h2 className="text-xl font-semibold text-slate-100">Probar Asistente IA</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Rol</label>
                    <select
                      value={aiRole}
                      onChange={(e) => setAiRole(e.target.value)}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-500"
                    >
                      <option value="doctor">Doctor (Diagnóstico)</option>
                      <option value="pharmacist">Farmacéutico (Sugerencia)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Consulta</label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={aiRole === "doctor" ? "Describe los síntomas del paciente..." : "Describe la consulta del cliente..."}
                      rows={5}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={testAi}
                    disabled={!aiPrompt.trim()}
                    className="rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 transition-colors disabled:opacity-50"
                  >
                    Consultar IA
                  </button>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Respuesta</label>
                  <div className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-4 min-h-[200px]">
                    {aiResponse ? (
                      <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{aiResponse}</p>
                    ) : (
                      <p className="text-sm text-slate-600">La respuesta de la IA aparecerá aquí...</p>
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
