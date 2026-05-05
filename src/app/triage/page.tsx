'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type Urgency = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
type TriageStatus = "PENDING" | "REVIEWED" | "ESCALATED" | "RESOLVED";

interface TriageReport {
  id: string;
  phone: string;
  symptoms: string;
  aiSummary?: string | null;
  urgency: Urgency;
  status: TriageStatus;
  aiConfidence: number;
  redFlags?: string | null;
  suggestedQuestions?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  patient?: { name: string; whatsappPhone?: string | null } | null;
}

const urgencyConfig: Record<Urgency, { label: string; color: string; bg: string; icon: string; pulse: boolean }> = {
  LOW: { label: "Leve", color: "text-green-400", bg: "bg-green-400/10", icon: "health_and_safety", pulse: false },
  MEDIUM: { label: "Moderado", color: "text-amber-400", bg: "bg-amber-400/10", icon: "warning", pulse: false },
  HIGH: { label: "Urgente", color: "text-orange-400", bg: "bg-orange-400/10", icon: "notification_important", pulse: true },
  EMERGENCY: { label: "Emergencia", color: "text-red-400", bg: "bg-red-400/10", icon: "emergency", pulse: true },
};

const statusConfig: Record<TriageStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "text-slate-400", bg: "bg-slate-400/10" },
  REVIEWED: { label: "Revisado", color: "text-blue-400", bg: "bg-blue-400/10" },
  ESCALATED: { label: "Escalado", color: "text-orange-400", bg: "bg-orange-400/10" },
  RESOLVED: { label: "Resuelto", color: "text-green-400", bg: "bg-green-400/10" },
};

export default function TriagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<TriageReport[]>([]);
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<TriageReport | null>(null);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    let url = "/api/triage?limit=100";
    if (filterUrgency !== "all") url += `&urgency=${filterUrgency}`;
    if (filterStatus !== "all") url += `&status=${filterStatus}`;
    
    const res = await fetch(url);
    setReports(await res.json());
  }, [filterUrgency, filterStatus]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { loadData(); }
  }, [status, loadData]);

  const emergencyCount = reports.filter((r) => r.urgency === "EMERGENCY").length;
  const highCount = reports.filter((r) => r.urgency === "HIGH").length;
  const pendingCount = reports.filter((r) => r.status === "PENDING").length;

  async function updateStatus(id: string, newStatus: TriageStatus) {
    const res = await fetch(`/api/triage/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setMessage(`Estado actualizado a ${statusConfig[newStatus].label}`);
      loadData();
      setTimeout(() => setMessage(""), 3000);
    }
  }

  if (status === "loading") return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/triage" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Triage con IA</h1>
              <p className="text-slate-500 mt-1">Evaluación automática de síntomas y clasificación de urgencia</p>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-4 text-[#00F5A0] text-sm">{message}</div>
          )}

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Emergencias</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{emergencyCount}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/30 bg-orange-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Urgentes</p>
              <p className="text-3xl font-bold text-orange-400 mt-2">{highCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Pendientes</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Total</p>
              <p className="text-3xl font-bold text-slate-100 mt-2">{reports.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <span className="text-sm text-slate-500 self-center">Urgencia:</span>
              {["all", "EMERGENCY", "HIGH", "MEDIUM", "LOW"].map((s) => (
                <button key={s} onClick={() => setFilterUrgency(s)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${filterUrgency === s ? "bg-[#00F5A0] text-[#0A0C10]" : "border border-[#30363D] text-slate-400 hover:text-slate-200"}`}>
                  {s === "all" ? "Todas" : urgencyConfig[s as Urgency]?.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <span className="text-sm text-slate-500 self-center">Estado:</span>
              {["all", "PENDING", "REVIEWED", "ESCALATED", "RESOLVED"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${filterStatus === s ? "bg-[#00F5A0] text-[#0A0C10]" : "border border-[#30363D] text-slate-400 hover:text-slate-200"}`}>
                  {s === "all" ? "Todos" : statusConfig[s as TriageStatus]?.label}
                </button>
              ))}
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">health_and_safety</span>
              <p className="text-slate-400">No hay reportes de triage</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const urgency = urgencyConfig[report.urgency];
                const st = statusConfig[report.status];
                const dateObj = new Date(report.createdAt);
                const timeAgo = getTimeAgo(dateObj);

                return (
                  <div key={report.id} className={`rounded-2xl border p-5 ${report.urgency === "EMERGENCY" ? "border-red-400/50 bg-red-400/5" : report.urgency === "HIGH" ? "border-orange-400/30 bg-orange-400/5" : "border-[#30363D] bg-[#161B22]"}`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${urgency.bg} flex items-center justify-center relative`}>
                          <span className={`material-symbols-outlined ${urgency.color}`}>{urgency.icon}</span>
                          {urgency.pulse && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{report.patient?.name || "Paciente no registrado"}</p>
                          <p className="text-sm text-slate-500">{report.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${urgency.bg} ${urgency.color}`}>
                          {urgency.label}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">{timeAgo}</p>
                          <p className="text-xs text-slate-600">Confianza: {Math.round(report.aiConfidence * 100)}%</p>
                        </div>

                        {report.status === "PENDING" && (
                          <div className="flex gap-1">
                            <button onClick={() => updateStatus(report.id, "REVIEWED")} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors">
                              Revisar
                            </button>
                            {(report.urgency === "HIGH" || report.urgency === "EMERGENCY") && (
                              <button onClick={() => updateStatus(report.id, "ESCALATED")} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-orange-400/10 text-orange-400 hover:bg-orange-400/20 transition-colors">
                                Escalar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-[#0A0C10] p-4 space-y-2">
                      <p className="text-xs text-slate-500">Síntomas reportados</p>
                      <p className="text-sm text-slate-200">{report.symptoms}</p>
                      {report.aiSummary && (
                        <>
                          <p className="text-xs text-slate-500 pt-2">Análisis de IA</p>
                          <p className="text-sm text-slate-300">{report.aiSummary}</p>
                        </>
                      )}
                      {report.redFlags && (
                        <>
                          <p className="text-xs text-slate-500 pt-2">⚠️ Señales de alerta</p>
                          <p className="text-sm text-red-400">{report.redFlags}</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}
