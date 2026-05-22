'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";
type Urgency = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
type TriageStatus = "PENDING" | "REVIEWED" | "ESCALATED" | "RESOLVED";

interface TriageReport {
  id: string; phone: string; symptoms: string; aiSummary?: string | null;
  urgency: Urgency; status: TriageStatus; aiConfidence: number;
  redFlags?: string | null; suggestedQuestions?: string | null;
  createdAt: string; reviewedAt?: string | null;
  patient?: { name: string; whatsappPhone?: string | null } | null;
}

const urgencyConfig: Record<Urgency, { label: string; color: string; bg: string; border: string; icon: string; pulse: boolean }> = {
  LOW:       { label: "Leve",       color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", icon: "health_and_safety",       pulse: false },
  MEDIUM:    { label: "Moderado",   color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   icon: "warning",                 pulse: false },
  HIGH:      { label: "Urgente",    color: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200",  icon: "notification_important",  pulse: true },
  EMERGENCY: { label: "Emergencia", color: "text-red-700",     bg: "bg-red-50",      border: "border-red-300",     icon: "emergency",               pulse: true },
};

const statusConfig: Record<TriageStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING:   { label: "Pendiente", color: "text-slate-600",   bg: "bg-slate-100",   border: "border-slate-200" },
  REVIEWED:  { label: "Revisado",  color: "text-blue-700",    bg: "bg-blue-50",     border: "border-blue-200" },
  ESCALATED: { label: "Escalado",  color: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200" },
  RESOLVED:  { label: "Resuelto",  color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200" },
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
}

export default function TriagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<TriageReport[]>([]);
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
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

  async function updateStatus(id: string, newStatus: TriageStatus) {
    const res = await fetch(`/api/triage/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    if (res.ok) { setMessage(`Estado: ${statusConfig[newStatus].label}`); loadData(); setTimeout(() => setMessage(""), 3000); }
  }

  const emergencyCount = reports.filter((r) => r.urgency === "EMERGENCY").length;
  const highCount      = reports.filter((r) => r.urgency === "HIGH").length;
  const pendingCount   = reports.filter((r) => r.status === "PENDING").length;

  if (status === "loading") return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/triage" userRole={(session?.user.role ?? "ADMIN") as AppRole} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Triage con IA</h1>
            <p className="text-slate-500 text-sm mt-1">Evaluación automática de síntomas y clasificación de urgencia</p>
          </div>

          {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">{message}</div>}

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Emergencias</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{emergencyCount}</p>
            </div>
            <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Urgentes</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{highCount}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pendientes</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{reports.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500 font-medium">Urgencia:</span>
              {["all", "EMERGENCY", "HIGH", "MEDIUM", "LOW"].map((s) => (
                <button key={s} onClick={() => setFilterUrgency(s)} className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${filterUrgency === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {s === "all" ? "Todas" : urgencyConfig[s as Urgency]?.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500 font-medium">Estado:</span>
              {["all", "PENDING", "REVIEWED", "ESCALATED", "RESOLVED"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${filterStatus === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {s === "all" ? "Todos" : statusConfig[s as TriageStatus]?.label}
                </button>
              ))}
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">health_and_safety</span>
              <p className="text-slate-500 font-medium">No hay reportes de triage</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const urgency = urgencyConfig[report.urgency];
                const st = statusConfig[report.status];
                return (
                  <div key={report.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${report.urgency === "EMERGENCY" ? "border-red-300" : report.urgency === "HIGH" ? "border-orange-200" : "border-slate-200"}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${urgency.bg} border ${urgency.border} flex items-center justify-center relative shrink-0`}>
                          <span className={`material-symbols-outlined ${urgency.color}`}>{urgency.icon}</span>
                          {urgency.pulse && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{report.patient?.name || "Paciente no registrado"}</p>
                          <p className="text-sm text-slate-500">{report.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${urgency.bg} ${urgency.border} ${urgency.color}`}>{urgency.label}</span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${st.bg} ${st.border} ${st.color}`}>{st.label}</span>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">{getTimeAgo(new Date(report.createdAt))}</p>
                          <p className="text-xs text-slate-400">Confianza IA: {Math.round(report.aiConfidence * 100)}%</p>
                        </div>
                        {report.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button onClick={() => updateStatus(report.id, "REVIEWED")} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">Revisar</button>
                            {(report.urgency === "HIGH" || report.urgency === "EMERGENCY") && (
                              <button onClick={() => updateStatus(report.id, "ESCALATED")} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors">Escalar</button>
                            )}
                          </div>
                        )}
                        {report.status === "REVIEWED" && (
                          <button onClick={() => updateStatus(report.id, "RESOLVED")} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">Resolver</button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Síntomas reportados</p>
                        <p className="text-sm text-slate-800">{report.symptoms}</p>
                      </div>
                      {report.aiSummary && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Análisis de IA</p>
                          <p className="text-sm text-slate-700">{report.aiSummary}</p>
                        </div>
                      )}
                      {report.redFlags && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                          <p className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            Señales de alerta
                          </p>
                          <p className="text-sm text-red-700">{report.redFlags}</p>
                        </div>
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
