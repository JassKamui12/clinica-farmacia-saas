'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

interface FollowUp {
  id: string;
  startDate: string;
  endDate?: string | null;
  status: "ACTIVE" | "COMPLETED" | "NON_ADHERENT" | "ALERT";
  adherenceScore: number;
  lastCheckIn?: string | null;
  nextCheckIn?: string | null;
  notes?: string | null;
  alertTriggered: boolean;
  alertReason?: string | null;
  patient: { id: string; name: string; whatsappPhone?: string | null };
  prescription?: { productName: string; dosage?: string | null } | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  ACTIVE: { label: "Activo", color: "text-[#00F5A0]", bg: "bg-[#00F5A0]/10", icon: "play_circle" },
  COMPLETED: { label: "Completado", color: "text-blue-400", bg: "bg-blue-400/10", icon: "check_circle" },
  NON_ADHERENT: { label: "No adherente", color: "text-red-400", bg: "bg-red-400/10", icon: "warning" },
  ALERT: { label: "Alerta", color: "text-amber-400", bg: "bg-amber-400/10", icon: "notification_important" },
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
    const res = await fetch("/api/followups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "COMPLETED" }),
    });
    if (res.ok) {
      setMessage("Seguimiento completado");
      loadData();
    }
    setLoading(false);
  }

  async function sendCheckIn(followUp: FollowUp) {
    setLoading(true);
    const phone = followUp.patient.whatsappPhone;
    if (!phone) {
      setMessage("Paciente sin teléfono WhatsApp registrado");
      setLoading(false);
      return;
    }

    const medication = followUp.prescription?.productName || "su tratamiento";
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        body: `Hola ${followUp.patient.name}, ¿cómo te sientes con ${medication}?\n\n1️⃣ Todo bien\n2️⃣ Molestias leves\n3️⃣ Efectos adversos\n4️⃣ No he podido tomarlo`,
        patientId: followUp.patient.id,
      }),
    });

    if (res.ok) {
      setMessage("Check-in enviado por WhatsApp");
    }
    setLoading(false);
  }

  if (sessionStatus === "loading") {
    return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;
  }

  const activeCount = followUps.filter((f) => f.status === "ACTIVE").length;
  const alertCount = followUps.filter((f) => f.alertTriggered || f.status === "ALERT").length;
  const nonAdherentCount = followUps.filter((f) => f.status === "NON_ADHERENT").length;

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/followups" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Seguimiento de Pacientes</h1>
            <p className="text-slate-500 mt-1">Monitorea la adherencia al tratamiento y envía recordatorios por WhatsApp</p>
          </div>

          {message && (
            <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-4 text-[#00F5A0] text-sm">{message}</div>
          )}

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Activos</p>
              <p className="text-3xl font-bold text-[#00F5A0] mt-2">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Alertas</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">{alertCount}</p>
            </div>
            <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">No adherentes</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{nonAdherentCount}</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Total</p>
              <p className="text-3xl font-bold text-slate-100 mt-2">{followUps.length}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {["all", "ACTIVE", "ALERT", "NON_ADHERENT", "COMPLETED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === s ? "bg-[#00F5A0] text-[#0A0C10]" : "border border-[#30363D] text-slate-400 hover:text-slate-200"
                }`}
              >
                {s === "all" ? "Todos" : statusConfig[s]?.label || s}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Link href="/whatsapp" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#25D366]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#25D366]">chat</span>
                <h3 className="text-lg font-semibold text-slate-100">WhatsApp</h3>
              </div>
              <p className="text-sm text-slate-500">Conversaciones con pacientes</p>
              <p className="text-xs text-[#25D366] mt-3 group-hover:underline">Ir a WhatsApp →</p>
            </Link>
            <Link href="/consultations" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#00F5A0]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#00F5A0]">medical_services</span>
                <h3 className="text-lg font-semibold text-slate-100">Consultas</h3>
              </div>
              <p className="text-sm text-slate-500">Nueva consulta médica</p>
              <p className="text-xs text-[#00F5A0] mt-3 group-hover:underline">Ir a consultas →</p>
            </Link>
            <Link href="/prescriptions" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#00D9FF]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#00D9FF]">medication</span>
                <h3 className="text-lg font-semibold text-slate-100">Recetas</h3>
              </div>
              <p className="text-sm text-slate-500">Historial de recetas</p>
              <p className="text-xs text-[#00D9FF] mt-3 group-hover:underline">Ir a recetas →</p>
            </Link>
          </div>

          <div className="space-y-3">
            {followUps.length === 0 ? (
              <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">health_and_safety</span>
                <p className="text-slate-400">No hay seguimientos activos</p>
              </div>
            ) : (
              followUps.map((fu) => {
                const config = statusConfig[fu.status];
                const nextDate = fu.nextCheckIn ? new Date(fu.nextCheckIn).toLocaleDateString("es-ES") : "No programado";
                const score = fu.adherenceScore;
                const scoreColor = score >= 80 ? "text-[#00F5A0]" : score >= 50 ? "text-amber-400" : "text-red-400";

                const startDate = fu.startDate ? new Date(fu.startDate) : null;
                const endDate = fu.endDate ? new Date(fu.endDate) : null;
                const daysElapsed = startDate ? Math.floor((Date.now() - startDate.getTime()) / 86400000) : 0;
                const daysRemaining = endDate ? Math.floor((endDate.getTime() - Date.now()) / 86400000) : null;
                const needsRenewal = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;
                const expired = daysRemaining !== null && daysRemaining < 0;

                return (
                  <div
                    key={fu.id}
                    className={`rounded-2xl border p-5 ${fu.alertTriggered ? "border-amber-400/50 bg-amber-400/5" : expired ? "border-red-400/50 bg-red-400/5" : "border-[#30363D] bg-[#161B22]"}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
                          <span className={`material-symbols-outlined ${config.color}`}>{config.icon}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{fu.patient.name}</p>
                          <p className="text-sm text-slate-500">
                            {fu.prescription?.productName || "Sin receta asociada"}
                            {fu.prescription?.dosage && ` · ${fu.prescription.dosage}`}
                          </p>
                          {fu.alertTriggered && fu.alertReason && (
                            <p className="text-xs text-amber-400 mt-1">⚠️ {fu.alertReason}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${scoreColor}`}>{score}%</p>
                          <p className="text-xs text-slate-500">Adherencia</p>
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-300">{daysElapsed}d</p>
                          <p className="text-xs text-slate-500">Transcurridos</p>
                        </div>

                        <div className="text-right">
                          {daysRemaining !== null && (
                            <p className={`text-sm font-medium ${needsRenewal ? "text-amber-400" : expired ? "text-red-400" : "text-slate-300"}`}>
                              {expired ? "Vencido" : needsRenewal ? "Renovar pronto" : `${daysRemaining}d restantes`}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">Próximo: {nextDate}</p>
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.color} mt-1`}>
                            {config.label}
                          </span>
                        </div>

                        {fu.status === "ACTIVE" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => sendCheckIn(fu)}
                              className="rounded-lg p-2 text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-colors"
                              title="Enviar check-in por WhatsApp"
                            >
                              <span className="material-symbols-outlined text-lg">send</span>
                            </button>
                            <button
                              onClick={() => completeFollowUp(fu.id)}
                              className="rounded-lg p-2 text-[#00F5A0] hover:bg-[#00F5A0]/10 transition-colors"
                              title="Completar seguimiento"
                            >
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {fu.notes && (
                      <p className="text-xs text-slate-600 mt-4 pt-4 border-t border-[#30363D]">{fu.notes}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
