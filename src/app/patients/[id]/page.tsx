'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";

interface Patient {
  id: string; name: string; phone?: string | null; email?: string | null;
  whatsappPhone?: string | null; dateOfBirth?: string | null; gender?: string | null;
  notes?: string | null; createdAt: string;
}
interface Visit {
  id: string; visitDate: string; symptoms?: string | null; diagnosis?: string | null;
  treatment?: string | null; notes?: string | null;
  doctor: { name?: string | null; email: string };
}
interface Prescription {
  id: string; productName: string; dosage?: string | null; instructions?: string | null;
  notes?: string | null; billingStatus?: string; createdAt: string;
  doctor: { name?: string | null; email: string };
}
interface Appointment {
  id: string; date: string; time: string; status: string; reason?: string | null;
  doctor: { name?: string | null; email: string };
}
interface FollowUp {
  id: string; status: string; adherenceScore: number; startDate: string;
  endDate?: string | null; nextCheckIn?: string | null; notes?: string | null;
}
interface TriageReport {
  id: string; symptoms: string; aiSummary: string; urgency: string;
  redFlags?: string | null; status: string; createdAt: string;
}
interface PatientHistory {
  patient: Patient; visits: Visit[]; prescriptions: Prescription[];
  appointments: Appointment[]; followUps: FollowUp[]; triageReports: TriageReport[];
  summary: { totalVisits: number; lastVisit: string | null; lastDiagnosis: string | null; activeFollowUps: number };
}

const apptStatusMap: Record<string, { color: string; bg: string; border: string }> = {
  COMPLETED: { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  CONFIRMED: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  CANCELLED: { color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  PENDING:   { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
};

const rxStatusMap: Record<string, { color: string; bg: string; border: string }> = {
  DELIVERED: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  BILLED:    { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  PENDING:   { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
};

const fuStatusMap: Record<string, { color: string; bg: string; border: string }> = {
  ACTIVE:       { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  COMPLETED:    { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  ALERT:        { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  NON_ADHERENT: { color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
};

const triageUrgencyMap: Record<string, { color: string; bg: string; border: string }> = {
  EMERGENCY: { color: "text-red-700",     bg: "bg-red-50",     border: "border-red-300" },
  HIGH:      { color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200" },
  MEDIUM:    { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  LOW:       { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

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
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;
  }
  if (!history) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-red-500">Paciente no encontrado</p></div>;

  const { patient, visits, prescriptions, appointments, followUps, triageReports, summary } = history;
  const age = patient.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000) : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/patients" userRole={(session?.user.role ?? "ADMIN") as AppRole} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <Link href="/patients" className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">← Volver a pacientes</Link>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">{patient.name}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {age && `${age} años`}{patient.gender && ` · ${patient.gender}`}
                {patient.whatsappPhone && ` · WhatsApp: ${patient.whatsappPhone}`}
              </p>
            </div>
            <Link href="/consultations" className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
              <span className="material-symbols-outlined text-lg">add</span>
              Nueva Consulta
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total consultas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{summary.totalVisits}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Última consulta</p>
              <p className="text-lg font-bold text-blue-600 mt-2">{summary.lastVisit ? new Date(summary.lastVisit).toLocaleDateString("es-ES") : "Nunca"}</p>
            </div>
            <div className="bg-violet-50 rounded-2xl border border-violet-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Último diagnóstico</p>
              <p className="text-sm font-medium text-violet-700 mt-2 leading-tight">{summary.lastDiagnosis || "Sin diagnóstico"}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Seguimientos activos</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{summary.activeFollowUps}</p>
            </div>
          </div>

          {patient.notes && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <p className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                Notas del paciente
              </p>
              <p className="text-sm text-amber-700">{patient.notes}</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {[
              { key: "visits", label: "Consultas", count: visits.length },
              { key: "prescriptions", label: "Recetas", count: prescriptions.length },
              { key: "appointments", label: "Citas", count: appointments.length },
              { key: "followups", label: "Seguimientos", count: followUps.length },
              { key: "triage", label: "Triajes", count: triageReports.length },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeTab === tab.key ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600"}`}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {activeTab === "visits" && (
            <div className="space-y-3">
              {visits.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">search_off</span>
                  <p className="text-slate-500 font-medium">Sin consultas registradas</p>
                </div>
              ) : visits.map((visit) => (
                <div key={visit.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-violet-600">medical_services</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{visit.doctor.name || visit.doctor.email}</p>
                      <p className="text-xs text-slate-500">{new Date(visit.visitDate).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {visit.symptoms && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs font-medium text-slate-500 mb-1">Síntomas</p>
                        <p className="text-sm text-slate-700">{visit.symptoms}</p>
                      </div>
                    )}
                    {visit.diagnosis && (
                      <div className="rounded-xl bg-violet-50 border border-violet-200 p-3">
                        <p className="text-xs font-medium text-slate-500 mb-1">Diagnóstico</p>
                        <p className="text-sm text-violet-800">{visit.diagnosis}</p>
                      </div>
                    )}
                    {visit.treatment && (
                      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-medium text-slate-500 mb-1">Tratamiento</p>
                        <p className="text-sm text-blue-800">{visit.treatment}</p>
                      </div>
                    )}
                  </div>
                  {visit.notes && <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">{visit.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div className="space-y-3">
              {prescriptions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">prescriptions</span>
                  <p className="text-slate-500 font-medium">Sin recetas registradas</p>
                </div>
              ) : prescriptions.map((rx) => {
                const st = rxStatusMap[rx.billingStatus ?? "PENDING"] ?? rxStatusMap.PENDING;
                return (
                  <div key={rx.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-violet-600">medication</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{rx.productName}</p>
                        <p className="text-xs text-slate-500">{rx.dosage || "Sin dosis"}{rx.instructions ? ` · ${rx.instructions}` : ""}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{rx.doctor.name || rx.doctor.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{new Date(rx.createdAt).toLocaleDateString("es-ES")}</p>
                      {rx.billingStatus && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border mt-1 inline-block ${st.bg} ${st.border} ${st.color}`}>{rx.billingStatus}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">event_busy</span>
                  <p className="text-slate-500 font-medium">Sin citas registradas</p>
                </div>
              ) : appointments.map((appt) => {
                const st = apptStatusMap[appt.status] ?? apptStatusMap.PENDING;
                return (
                  <div key={appt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-600">calendar_month</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{appt.doctor.name || appt.doctor.email}</p>
                        {appt.reason && <p className="text-xs text-slate-500">{appt.reason}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">{new Date(appt.date).toLocaleDateString("es-ES")}</p>
                      <p className="text-xl font-bold text-slate-900">{appt.time}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border inline-block mt-1 ${st.bg} ${st.border} ${st.color}`}>{appt.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "followups" && (
            <div className="space-y-3">
              {followUps.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">monitor_heart</span>
                  <p className="text-slate-500 font-medium">Sin seguimientos registrados</p>
                </div>
              ) : followUps.map((fu) => {
                const st = fuStatusMap[fu.status] ?? fuStatusMap.ACTIVE;
                const scoreColor = fu.adherenceScore >= 80 ? "text-emerald-600" : fu.adherenceScore >= 50 ? "text-amber-600" : "text-red-600";
                return (
                  <div key={fu.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${fu.status === "ALERT" ? "border-amber-300" : "border-slate-200"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">Inicio: {new Date(fu.startDate).toLocaleDateString("es-ES")}</p>
                        <p className="text-xs text-slate-500">{fu.notes || "Sin notas"}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${scoreColor}`}>{fu.adherenceScore}%</p>
                        <p className="text-xs text-slate-400">Adherencia</p>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border inline-block mt-1 ${st.bg} ${st.border} ${st.color}`}>{fu.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "triage" && (
            <div className="space-y-3">
              {triageReports.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">health_and_safety</span>
                  <p className="text-slate-500 font-medium">Sin triajes registrados</p>
                </div>
              ) : triageReports.map((tr) => {
                const urg = triageUrgencyMap[tr.urgency] ?? triageUrgencyMap.LOW;
                return (
                  <div key={tr.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${urg.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">{tr.symptoms}</p>
                        <p className="text-xs text-slate-500">{new Date(tr.createdAt).toLocaleDateString("es-ES")}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${urg.bg} ${urg.border} ${urg.color}`}>{tr.urgency}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{tr.aiSummary}</p>
                    {tr.redFlags && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        {tr.redFlags}
                      </div>
                    )}
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
