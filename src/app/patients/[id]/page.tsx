'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

interface Patient {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  whatsappPhone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface Visit {
  id: string;
  visitDate: string;
  symptoms?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
  doctor: { name?: string | null; email: string };
}

interface Prescription {
  id: string;
  productName: string;
  dosage?: string | null;
  instructions?: string | null;
  notes?: string | null;
  billingStatus?: string;
  createdAt: string;
  doctor: { name?: string | null; email: string };
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  reason?: string | null;
  doctor: { name?: string | null; email: string };
}

interface FollowUp {
  id: string;
  status: string;
  adherenceScore: number;
  startDate: string;
  endDate?: string | null;
  nextCheckIn?: string | null;
  notes?: string | null;
}

interface TriageReport {
  id: string;
  symptoms: string;
  aiSummary: string;
  urgency: string;
  redFlags?: string | null;
  status: string;
  createdAt: string;
}

interface PatientHistory {
  patient: Patient;
  visits: Visit[];
  prescriptions: Prescription[];
  appointments: Appointment[];
  followUps: FollowUp[];
  triageReports: TriageReport[];
  summary: { totalVisits: number; lastVisit: string | null; lastDiagnosis: string | null; activeFollowUps: number };
}

export default function PatientHistoryPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"visits" | "prescriptions" | "appointments" | "followups" | "triage">("visits");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") { router.push("/login"); return; }
    if (sessionStatus === "authenticated" && patientId) {
      fetch(`/api/patients/${patientId}/history`)
        .then((res) => res.json())
        .then((data) => { setHistory(data); setLoading(false); });
    }
  }, [sessionStatus, patientId]);

  if (sessionStatus === "loading" || loading) {
    return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;
  }

  if (!history) return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-red-400">Paciente no encontrado</p></div>;

  const { patient, visits, prescriptions, appointments, followUps, triageReports, summary } = history;
  const age = patient.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000) : null;

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/patients" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/patients" className="text-sm text-slate-500 hover:text-[#00F5A0] transition-colors">← Volver a pacientes</Link>
              <h1 className="text-3xl font-bold text-slate-100 mt-2">{patient.name}</h1>
              <p className="text-slate-500 mt-1">
                {age && `${age} años`} {patient.gender && `· ${patient.gender}`}
                {patient.whatsappPhone && `· WhatsApp: ${patient.whatsappPhone}`}
              </p>
            </div>
            <Link href="/consultations" className="rounded-2xl bg-[#00F5A0] px-5 py-2.5 text-sm font-bold text-[#0A0C10] hover:bg-[#00e293] transition-colors">
              Nueva Consulta
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Total consultas</p>
              <p className="text-3xl font-bold text-[#00F5A0] mt-2">{summary.totalVisits}</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Última consulta</p>
              <p className="text-lg font-bold text-[#00D9FF] mt-2">{summary.lastVisit ? new Date(summary.lastVisit).toLocaleDateString("es-ES") : "Nunca"}</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Último diagnóstico</p>
              <p className="text-sm font-medium text-purple-400 mt-2">{summary.lastDiagnosis || "Sin diagnóstico"}</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Seguimientos activos</p>
              <p className="text-3xl font-bold text-pink-400 mt-2">{summary.activeFollowUps}</p>
            </div>
          </div>

          {patient.notes && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <p className="text-sm font-medium text-amber-400 mb-1">Notas del paciente</p>
              <p className="text-sm text-slate-300">{patient.notes}</p>
            </div>
          )}

           <div className="flex gap-2">
             {[
               { key: "visits", label: "Consultas", count: visits.length },
               { key: "prescriptions", label: "Recetas", count: prescriptions.length },
               { key: "appointments", label: "Citas", count: appointments.length },
               { key: "followups", label: "Seguimientos", count: followUps.length },
               { key: "triage", label: "Triajes", count: triageReports.length },
             ].map((tab) => (
               <button
                 key={tab.key}
                 onClick={() => setActiveTab(tab.key as any)}
                 className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                   activeTab === tab.key
                     ? "bg-[#00F5A0] text-[#0A0C10]"
                     : "border border-[#30363D] text-slate-400 hover:text-slate-200"
                 }`}
               >
                 {tab.label} ({tab.count})
               </button>
             ))}
           </div>

          {activeTab === "visits" && (
            <div className="space-y-3">
              {visits.length === 0 ? (
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">search_off</span>
                  <p className="text-slate-500">Sin consultas registradas</p>
                </div>
              ) : (
                visits.map((visit) => (
                  <div key={visit.id} className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-purple-400">medical_services</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{visit.doctor.name || visit.doctor.email}</p>
                          <p className="text-xs text-slate-500">{new Date(visit.visitDate).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {visit.symptoms && (
                        <div className="rounded-xl bg-[#0A0C10] p-3">
                          <p className="text-xs text-slate-500 mb-1">Síntomas</p>
                          <p className="text-sm text-slate-300">{visit.symptoms}</p>
                        </div>
                      )}
                      {visit.diagnosis && (
                        <div className="rounded-xl bg-[#0A0C10] p-3">
                          <p className="text-xs text-slate-500 mb-1">Diagnóstico</p>
                          <p className="text-sm text-slate-300">{visit.diagnosis}</p>
                        </div>
                      )}
                      {visit.treatment && (
                        <div className="rounded-xl bg-[#0A0C10] p-3">
                          <p className="text-xs text-slate-500 mb-1">Tratamiento</p>
                          <p className="text-sm text-slate-300">{visit.treatment}</p>
                        </div>
                      )}
                    </div>
                    {visit.notes && <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-[#30363D]">{visit.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div className="space-y-3">
              {prescriptions.length === 0 ? (
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">prescriptions</span>
                  <p className="text-slate-500">Sin recetas registradas</p>
                </div>
              ) : (
                prescriptions.map((rx) => (
                  <div key={rx.id} className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#00D9FF]">medication</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{rx.productName}</p>
                        <p className="text-xs text-slate-500">{rx.dosage || "Sin dosis"} · {rx.instructions || ""}</p>
                        <p className="text-xs text-slate-600 mt-1">{rx.doctor.name || rx.doctor.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{new Date(rx.createdAt).toLocaleDateString("es-ES")}</p>
                      {rx.billingStatus && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          rx.billingStatus === "BILLED" ? "bg-[#00F5A0]/10 text-[#00F5A0]" :
                          rx.billingStatus === "DELIVERED" ? "bg-blue-400/10 text-blue-400" :
                          "bg-amber-400/10 text-amber-400"
                        }`}>
                          {rx.billingStatus}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">event_busy</span>
                  <p className="text-slate-500">Sin citas registradas</p>
                </div>
              ) : (
                appointments.map((appt) => (
                  <div key={appt.id} className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00F5A0]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#00F5A0]">calendar_month</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{appt.doctor.name || appt.doctor.email}</p>
                        {appt.reason && <p className="text-xs text-slate-500">{appt.reason}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-300">{new Date(appt.date).toLocaleDateString("es-ES")}</p>
                      <p className="text-lg font-bold text-slate-100">{appt.time}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        appt.status === "COMPLETED" ? "bg-blue-400/10 text-blue-400" :
                        appt.status === "CONFIRMED" ? "bg-[#00F5A0]/10 text-[#00F5A0]" :
                        appt.status === "CANCELLED" ? "bg-red-400/10 text-red-400" :
                        "bg-amber-400/10 text-amber-400"
                      }`}>{appt.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "followups" && (
            <div className="space-y-3">
              {followUps.length === 0 ? (
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">monitor_heart</span>
                  <p className="text-slate-500">Sin seguimientos registrados</p>
                </div>
              ) : (
                followUps.map((fu) => (
                  <div key={fu.id} className={`rounded-2xl border p-5 ${fu.status === "ALERT" ? "border-amber-400/50 bg-amber-400/5" : "border-[#30363D] bg-[#161B22]"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-100">Inicio: {new Date(fu.startDate).toLocaleDateString("es-ES")}</p>
                        <p className="text-xs text-slate-500">{fu.notes || "Sin notas"}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${fu.adherenceScore >= 80 ? "text-[#00F5A0]" : fu.adherenceScore >= 50 ? "text-amber-400" : "text-red-400"}`}>{fu.adherenceScore}%</p>
                        <p className="text-xs text-slate-500">Adherencia</p>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          fu.status === "ACTIVE" ? "bg-[#00F5A0]/10 text-[#00F5A0]" :
                          fu.status === "COMPLETED" ? "bg-blue-400/10 text-blue-400" :
                          fu.status === "ALERT" ? "bg-amber-400/10 text-amber-400" :
                          "bg-red-400/10 text-red-400"
                        }`}>{fu.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "triage" && (
            <div className="space-y-3">
              {triageReports.length === 0 ? (
                <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">health_and_safety</span>
                  <p className="text-slate-500">Sin triajes registrados</p>
                </div>
              ) : (
                triageReports.map((tr) => (
                  <div key={tr.id} className={`rounded-2xl border p-5 ${
                    tr.urgency === "EMERGENCY" ? "border-red-400/50 bg-red-400/5" :
                    tr.urgency === "HIGH" ? "border-amber-400/50 bg-amber-400/5" :
                    "border-[#30363D] bg-[#161B22]"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-100">Síntomas: {tr.symptoms}</p>
                        <p className="text-xs text-slate-500">{new Date(tr.createdAt).toLocaleDateString("es-ES")}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        tr.urgency === "EMERGENCY" ? "bg-red-400/10 text-red-400" :
                        tr.urgency === "HIGH" ? "bg-amber-400/10 text-amber-400" :
                        tr.urgency === "MEDIUM" ? "bg-blue-400/10 text-blue-400" :
                        "bg-[#00F5A0]/10 text-[#00F5A0]"
                      }`}>{tr.urgency}</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{tr.aiSummary}</p>
                    {tr.redFlags && <p className="text-xs text-red-400">🚩 {tr.redFlags}</p>}
                    <span className={`text-xs font-medium ${
                      tr.status === "PENDING" ? "text-amber-400" :
                      tr.status === "REVIEWED" ? "text-blue-400" :
                      "text-[#00F5A0]"
                    }`}>{tr.status}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
