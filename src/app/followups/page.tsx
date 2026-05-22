'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";

interface FollowUp {
  id: string; startDate: string; endDate?: string | null;
  status: "ACTIVE" | "COMPLETED" | "NON_ADHERENT" | "ALERT";
  adherenceScore: number; lastCheckIn?: string | null; nextCheckIn?: string | null;
  notes?: string | null; alertTriggered: boolean; alertReason?: string | null;
  patient: { id: string; name: string; whatsappPhone?: string | null };
  prescription?: { productName: string; dosage?: string | null } | null;
}

const statusConfig = {
  ACTIVE:        { label: "Activo",         color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", icon: "play_circle" },
  COMPLETED:     { label: "Completado",     color: "text-blue-700",    bg: "bg-blue-50",     border: "border-blue-200",    icon: "check_circle" },
  NON_ADHERENT:  { label: "No adherente",   color: "text-red-700",     bg: "bg-red-50",      border: "border-red-200",     icon: "warning" },
  ALERT:         { label: "Alerta",         color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   icon: "notification_important" },
};

export default function FollowUpsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const url = filter === "all" ? "/api/followups" : `/api/followups?status=${filter}`;
    const res = await fetch(url);
    setFollowUps(await res.json());
  }, [filter]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") { router.push("/login"); return; }
    if (sessionStatus === "authenticated") { loadData(); }
  }, [sessionStatus, loadData]);

  async function completeFollowUp(id: string) {
    setLoading(true);
    const res = await fetch("/api/followups", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "COMPLETED" }) });
    if (res.ok) { setMessage("Seguimiento completado"); loadData(); }
    setLoading(false);
  }

  async function sendCheckIn(fu: FollowUp) {
    setLoading(true);
    const phone = fu.patient.whatsappPhone;
    if (!phone) { setMessage("Paciente sin WhatsApp registrado"); setLoading(false); return; }
    const medication = fu.prescription?.productName || "su tratamiento";
    const res = await fetch("/api/whatsapp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, body: `Hola ${fu.patient.name}, ¿cómo te sientes con ${medication}?\n\n1️⃣ Todo bien\n2️⃣ Molestias leves\n3️⃣ Efectos adversos\n4️⃣ No he podido tomarlo`, patientId: fu.patient.id }) });
    if (res.ok) setMessage("Check-in enviado por WhatsApp");
    setLoading(false);
  }

  const activeCount = followUps.filter((f) => f.status === "ACTIVE").length;
  const alertCount  = followUps.filter((f) => f.alertTriggered || f.status === "ALERT").length;
  const nonAdherentCount = followUps.filter((f) => f.status === "NON_ADHERENT").length;

  if (sessionStatus === "loading") return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/followups" userRole={(session?.user.role ?? "ADMIN") as AppRole} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Seguimiento de Pacientes</h1>
            <p className="text-slate-500 text-sm mt-1">Monitorea la adherencia al tratamiento y envía recordatorios por WhatsApp</p>
          </div>

          {message && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">{message}</div>
          )}

          {/* Stats */}
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Activos</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{activeCount}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Alertas</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{alertCount}</p>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">No adherentes</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{nonAdherentCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{followUps.length}</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { href: "/whatsapp",     icon: "chat",            color: "text-[#25D366]", bg: "bg-emerald-50",  border: "border-emerald-200", title: "WhatsApp",   desc: "Conversaciones con pacientes" },
              { href: "/consultations",icon: "stethoscope",     color: "text-blue-600",  bg: "bg-blue-50",     border: "border-blue-200",    title: "Consultas",  desc: "Nueva consulta médica" },
              { href: "/prescriptions",icon: "pill",            color: "text-violet-600",bg: "bg-violet-50",   border: "border-violet-200",  title: "Recetas",    desc: "Historial de recetas" },
            ].map((c) => (
              <Link key={c.href} href={c.href} className={`bg-white rounded-2xl border ${c.border} shadow-sm p-5 hover:shadow-md transition-all group`}>
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <span className={`material-symbols-outlined ${c.color}`}>{c.icon}</span>
                </div>
                <p className="font-semibold text-slate-900">{c.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{c.desc}</p>
                <p className={`text-xs font-medium mt-3 ${c.color} group-hover:underline`}>Ir →</p>
              </Link>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", "ACTIVE", "ALERT", "NON_ADHERENT", "COMPLETED"].map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${filter === s ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600"}`}>
                {s === "all" ? "Todos" : statusConfig[s as keyof typeof statusConfig]?.label || s}
              </button>
            ))}
          </div>

          {/* List */}
          {followUps.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">health_and_safety</span>
              <p className="text-slate-500 font-medium">No hay seguimientos activos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followUps.map((fu) => {
                const cfg = statusConfig[fu.status];
                const nextDate = fu.nextCheckIn ? new Date(fu.nextCheckIn).toLocaleDateString("es-HN") : "No programado";
                const score = fu.adherenceScore;
                const scoreColor = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
                const startDate = fu.startDate ? new Date(fu.startDate) : null;
                const endDate = fu.endDate ? new Date(fu.endDate) : null;
                const daysElapsed = startDate ? Math.floor((Date.now() - startDate.getTime()) / 86400000) : 0;
                const daysRemaining = endDate ? Math.floor((endDate.getTime() - Date.now()) / 86400000) : null;
                const isAlert = fu.alertTriggered || fu.status === "ALERT";

                return (
                  <div key={fu.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${isAlert ? "border-amber-300" : "border-slate-200"}`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                          <span className={`material-symbols-outlined ${cfg.color}`}>{cfg.icon}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{fu.patient.name}</p>
                          <p className="text-sm text-slate-500">
                            {fu.prescription?.productName || "Sin receta asociada"}
                            {fu.prescription?.dosage && ` · ${fu.prescription.dosage}`}
                          </p>
                          {isAlert && fu.alertReason && (
                            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">warning</span>
                              {fu.alertReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${scoreColor}`}>{score}%</p>
                          <p className="text-xs text-slate-400">Adherencia</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-slate-700">{daysElapsed}d</p>
                          <p className="text-xs text-slate-400">Transcurridos</p>
                        </div>
                        <div className="text-right">
                          {daysRemaining !== null && (
                            <p className={`text-sm font-medium ${daysRemaining < 0 ? "text-red-600" : daysRemaining <= 7 ? "text-amber-600" : "text-slate-600"}`}>
                              {daysRemaining < 0 ? "Vencido" : daysRemaining <= 7 ? "Renovar pronto" : `${daysRemaining}d restantes`}
                            </p>
                          )}
                          <p className="text-xs text-slate-400">Próximo: {nextDate}</p>
                          <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-medium mt-1 ${cfg.bg} ${cfg.border} ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        {fu.status === "ACTIVE" && (
                          <div className="flex gap-1">
                            <button onClick={() => sendCheckIn(fu)} disabled={loading} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Enviar check-in WhatsApp">
                              <span className="material-symbols-outlined text-lg">send</span>
                            </button>
                            <button onClick={() => completeFollowUp(fu.id)} disabled={loading} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Completar">
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {fu.notes && <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">{fu.notes}</p>}
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
