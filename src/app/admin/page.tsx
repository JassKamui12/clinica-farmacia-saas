'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

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

interface AiRecommendation {
  id: string; role: string; prompt: string; response: string; createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    users: 0, patients: 0, visits: 0, prescriptions: 0, appointments: 0,
    followups: 0, products: 0, whatsappMessages: 0, alerts: 0,
  });
  const [recentMessages, setRecentMessages] = useState<WhatsAppMessage[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>([]);
  const [userRole, setUserRole] = useState("all");
  const [activeTab, setActiveTab] = useState<"overview" | "whatsapp" | "ai" | "settings">("overview");

  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiRole, setAiRole] = useState("doctor");
  const [aiResponse, setAiResponse] = useState("");

  const loadData = useCallback(async () => {
    const [usersRes, patientsRes, visitsRes, rxRes, apptsRes, fuRes, prodsRes, msgsRes, notifsRes, aiRes] = await Promise.all([
      fetch("/api/users"), fetch("/api/patients"), fetch("/api/visits"),
      fetch("/api/prescriptions"), fetch("/api/appointments"),
      fetch("/api/followups?status=ACTIVE"), fetch("/api/products"),
      fetch("/api/whatsapp/messages?limit=10"), fetch("/api/notifications"),
      fetch("/api/ai/history").catch(() => new Response(JSON.stringify([]), { status: 200 })),
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
      whatsappMessages: msgs.length, alerts: fu.filter((f: any) => f.alertTriggered).length,
    });

    setRecentMessages(msgs);
    setRecentNotifications(notifs.slice(0, 5));

    if (aiRes.ok) {
      setAiRecommendations(await aiRes.json());
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { loadData(); }
  }, [status, loadData]);

  async function testAi() {
    if (!aiPrompt.trim()) return;
    setAiResponse("Consultando IA...");
    const role = aiRole === "doctor" ? "diagnose" : "pharmacy";
    const endpoint = role === "diagnose" ? "/api/ai/diagnose" : "/api/ai/pharmacy";
    const body = role === "diagnose"
      ? { patientName: "Paciente", symptoms: aiPrompt, availableMedications: [] }
      : { customerDescription: aiPrompt, availableMedications: [] };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setAiResponse(data.text || data.response || "Sin respuesta");
    loadData();
  }

  if (status === "loading") return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/admin" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Panel de Administración</h1>
            <p className="text-slate-500 mt-1">Métricas globales, IA y configuración del sistema</p>
          </div>

          <div className="flex gap-2">
            {[
              { key: "overview", label: "General", icon: "dashboard" },
              { key: "whatsapp", label: "WhatsApp", icon: "chat" },
              { key: "ai", label: "IA Assistant", icon: "smart_toy" },
              { key: "settings", label: "Configuración", icon: "settings" },
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

          {activeTab === "overview" && (
            <>
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Usuarios</p>
                  <p className="text-3xl font-bold text-[#00F5A0] mt-2">{stats.users}</p>
                </div>
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Pacientes</p>
                  <p className="text-3xl font-bold text-[#00D9FF] mt-2">{stats.patients}</p>
                </div>
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Consultas</p>
                  <p className="text-3xl font-bold text-purple-400 mt-2">{stats.visits}</p>
                </div>
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Citas</p>
                  <p className="text-3xl font-bold text-pink-400 mt-2">{stats.appointments}</p>
                </div>
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Recetas</p>
                  <p className="text-3xl font-bold text-amber-400 mt-2">{stats.prescriptions}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Productos</p>
                  <p className="text-3xl font-bold text-slate-100 mt-2">{stats.products}</p>
                </div>
                <div className="rounded-2xl border border-[#25D366]/30 bg-[#161B22] p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Mensajes WA</p>
                  <p className="text-3xl font-bold text-[#25D366] mt-2">{stats.whatsappMessages}</p>
                </div>
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Seguimientos</p>
                  <p className="text-3xl font-bold text-cyan-400 mt-2">{stats.followups}</p>
                </div>
                <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Alertas</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{stats.alerts}</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#25D366]">chat</span>
                    <h2 className="text-lg font-semibold text-slate-100">Actividad WhatsApp</h2>
                  </div>
                  {recentMessages.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Sin mensajes aún</p>
                  ) : (
                    <div className="space-y-2">
                      {recentMessages.map((msg) => (
                        <div key={msg.id} className={`rounded-xl border p-3 ${msg.direction === "INBOUND" ? "bg-[#25D366]/5 border-[#25D366]/20" : "bg-[#0A0C10] border-[#30363D]"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-xs ${msg.direction === "INBOUND" ? "text-[#25D366]" : "text-[#00D9FF]"}`}>
                                {msg.direction === "INBOUND" ? "call_received" : "call_made"}
                              </span>
                              <span className="text-sm text-slate-300">{msg.patient?.name || msg.phone}</span>
                            </div>
                            <span className="text-xs text-slate-600">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                          </div>
                          {msg.body && <p className="text-xs text-slate-400 mt-1 truncate">{msg.body}</p>}
                          {msg.intent && <span className="text-xs bg-[#25D366]/10 text-[#25D366] px-2 py-0.5 rounded-full mt-1 inline-block">{msg.intent}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
                  <h2 className="text-lg font-semibold text-slate-100 mb-4">Notificaciones del Sistema</h2>
                  {recentNotifications.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Sin notificaciones</p>
                  ) : (
                    <div className="space-y-2">
                      {recentNotifications.map((n) => (
                        <div key={n.id} className={`rounded-xl border p-3 ${n.read ? "bg-[#0A0C10] border-[#30363D]" : "bg-[#00F5A0]/5 border-[#00F5A0]/20"}`}>
                          <p className="text-sm font-medium text-slate-100">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{n.content}</p>
                          <p className="text-xs text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Link href="/appointments" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#00F5A0]/30 transition-colors group">
                  <span className="material-symbols-outlined text-[#00F5A0] text-2xl">calendar_month</span>
                  <h3 className="text-lg font-semibold text-slate-100 mt-3">Gestionar Citas</h3>
                  <p className="text-sm text-slate-500 mt-1">Programación y seguimiento</p>
                  <p className="text-xs text-[#00F5A0] mt-3 group-hover:underline">Abrir →</p>
                </Link>
                <Link href="/followups" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#00D9FF]/30 transition-colors group">
                  <span className="material-symbols-outlined text-[#00D9FF] text-2xl">monitor_heart</span>
                  <h3 className="text-lg font-semibold text-slate-100 mt-3">Seguimientos</h3>
                  <p className="text-sm text-slate-500 mt-1">Adherencia y alertas</p>
                  <p className="text-xs text-[#00D9FF] mt-3 group-hover:underline">Abrir →</p>
                </Link>
                <Link href="/whatsapp" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#25D366]/30 transition-colors group">
                  <span className="material-symbols-outlined text-[#25D366] text-2xl">chat</span>
                  <h3 className="text-lg font-semibold text-slate-100 mt-3">WhatsApp</h3>
                  <p className="text-sm text-slate-500 mt-1">Conversaciones con pacientes</p>
                  <p className="text-xs text-[#25D366] mt-3 group-hover:underline">Abrir →</p>
                </Link>
              </div>
            </>
          )}

          {activeTab === "whatsapp" && (
            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-6">
              <h2 className="text-xl font-semibold text-slate-100">Configuración WhatsApp</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Access Token</label>
                  <input
                    value={whatsappToken}
                    onChange={(e) => setWhatsappToken(e.target.value)}
                    placeholder="EAI..."
                    className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#25D366]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Phone Number ID</label>
                  <input
                    value={whatsappPhoneId}
                    onChange={(e) => setWhatsappPhoneId(e.target.value)}
                    placeholder="123456789"
                    className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#25D366]"
                  />
                </div>
              </div>
              <div className="rounded-xl bg-[#0A0C10] p-4">
                <p className="text-sm font-medium text-slate-300 mb-2">Webhook URL</p>
                <code className="text-xs text-[#00F5A0] bg-[#161B22] px-2 py-1 rounded block">{typeof window !== "undefined" ? window.location.origin : ""}/api/whatsapp/webhook</code>
                <p className="text-xs text-slate-500 mt-2">Configura esta URL en Meta Developers para recibir mensajes</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Plantillas configuradas</p>
                <div className="flex flex-wrap gap-2">
                  {["confirmar_cita", "recordatorio_24h", "recordatorio_1h", "seguimiento", "receta_lista"].map((t) => (
                    <span key={t} className="text-xs bg-[#161B22] text-slate-400 px-3 py-1.5 rounded-full border border-[#30363D]">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Flujos del Bot IA</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { num: "1", label: "Agendar cita", desc: "El paciente solicita cita, la IA verifica disponibilidad" },
                    { num: "2", label: "Consultar cita", desc: "El paciente consulta su próxima cita programada" },
                    { num: "3", label: "Seguimiento", desc: "Recordatorio de tratamiento y check-in de adherencia" },
                    { num: "4", label: "Consultar receta", desc: "El paciente consulta su receta y productos" },
                    { num: "5", label: "Consulta farmacia", desc: "Pregunta por disponibilidad de medicamentos" },
                    { num: "6", label: "Hablar con humano", desc: "Transferencia al doctor o farmacéutico" },
                  ].map((flow) => (
                    <div key={flow.num} className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-full bg-[#25D366]/10 text-[#25D366] text-xs font-bold flex items-center justify-center">{flow.num}</span>
                        <span className="text-sm font-medium text-slate-200">{flow.label}</span>
                      </div>
                      <p className="text-xs text-slate-500">{flow.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === "ai" && (
            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-6">
              <h2 className="text-xl font-semibold text-slate-100">Asistente IA</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Rol</label>
                    <select value={aiRole} onChange={(e) => setAiRole(e.target.value)} className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-500">
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
                      rows={4}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                  <button onClick={testAi} disabled={!aiPrompt.trim()} className="rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 transition-colors disabled:opacity-50">
                    Consultar IA
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Respuesta</label>
                  <div className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-4 min-h-[200px]">
                    {aiResponse ? (
                      <p className="text-sm text-slate-300 whitespace-pre-line">{aiResponse}</p>
                    ) : (
                      <p className="text-sm text-slate-600">La respuesta de la IA aparecerá aquí...</p>
                    )}
                  </div>
                </div>
              </div>

              {aiRecommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Historial de consultas IA</h3>
                  <div className="space-y-3">
                    {aiRecommendations.slice(0, 5).map((rec) => (
                      <div key={rec.id} className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${rec.role === "doctor" ? "bg-purple-400/10 text-purple-400" : "bg-[#25D366]/10 text-[#25D366]"}`}>
                            {rec.role === "doctor" ? "Diagnóstico" : "Farmacia"}
                          </span>
                          <span className="text-xs text-slate-600">{new Date(rec.createdAt).toLocaleDateString("es-ES")}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{rec.prompt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === "settings" && (
            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-6">
              <h2 className="text-xl font-semibold text-slate-100">Configuración del Sistema</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-5">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Variables de Entorno</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">DATABASE_URL</span>
                      <span className="text-xs text-[#00F5A0] bg-[#00F5A0]/10 px-2 py-1 rounded">Configurada</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">NEXTAUTH_SECRET</span>
                      <span className="text-xs text-[#00F5A0] bg-[#00F5A0]/10 px-2 py-1 rounded">Configurada</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">WHATSAPP_ACCESS_TOKEN</span>
                      <span className={`text-xs px-2 py-1 rounded ${process.env.WHATSAPP_ACCESS_TOKEN ? "bg-[#00F5A0]/10 text-[#00F5A0]" : "bg-amber-400/10 text-amber-400"}`}>
                        {process.env.WHATSAPP_ACCESS_TOKEN ? "Configurada" : "Pendiente"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">ANTHROPIC_API_KEY</span>
                      <span className={`text-xs px-2 py-1 rounded ${process.env.ANTHROPIC_API_KEY ? "bg-[#00F5A0]/10 text-[#00F5A0]" : "bg-amber-400/10 text-amber-400"}`}>
                        {process.env.ANTHROPIC_API_KEY ? "Configurada" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-5">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Accesos Rápidos</h3>
                  <div className="space-y-2">
                    <Link href="/patients" className="flex items-center gap-3 p-3 rounded-xl bg-[#161B22] hover:bg-[#161B22]/80 transition-colors">
                      <span className="material-symbols-outlined text-[#00F5A0]">person</span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">Gestión de Pacientes</p>
                        <p className="text-xs text-slate-500">Crear y administrar pacientes</p>
                      </div>
                    </Link>
                    <Link href="/inventory" className="flex items-center gap-3 p-3 rounded-xl bg-[#161B22] hover:bg-[#161B22]/80 transition-colors">
                      <span className="material-symbols-outlined text-[#00D9FF]">inventory_2</span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">Inventario</p>
                        <p className="text-xs text-slate-500">Productos y stock</p>
                      </div>
                    </Link>
                    <Link href="/pharmacist" className="flex items-center gap-3 p-3 rounded-xl bg-[#161B22] hover:bg-[#161B22]/80 transition-colors">
                      <span className="material-symbols-outlined text-[#25D366]">medication</span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">Panel Farmacia</p>
                        <p className="text-xs text-slate-500">Facturación y recetas</p>
                      </div>
                    </Link>
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
