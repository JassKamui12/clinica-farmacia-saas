import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function DoctorDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const doctorId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todayAppointments,
    pendingAppointments,
    recentVisits,
    activeFollowUps,
    alerts,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: today, lt: tomorrow },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        patient: { select: { id: true, name: true, whatsappPhone: true, notes: true } },
      },
      orderBy: { time: "asc" },
    }),
    prisma.appointment.count({
      where: {
        doctorId,
        date: { gte: tomorrow },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.clinicalVisit.findMany({
      where: { doctorId },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { visitDate: "desc" },
      take: 5,
    }),
    prisma.patientFollowUp.count({
      where: {
        status: "ACTIVE",
        prescription: { doctorId },
      },
    }),
    prisma.patientFollowUp.findMany({
      where: { alertTriggered: true, status: "ALERT" },
      include: {
        patient: { select: { name: true, whatsappPhone: true } },
        prescription: { select: { productName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const todayStr = today.toLocaleDateString("es-ES", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/doctor" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Buenos días, {session.user.name}</h1>
              <p className="text-slate-500 mt-1 capitalize">{todayStr}</p>
            </div>
            <Link href="/consultations" className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] px-5 py-2.5 text-sm font-bold text-[#0A0C10] shadow-[0_20px_45px_-20px_rgba(0,245,160,0.7)] hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-lg">medical_services</span>
              Nueva Consulta
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Citas hoy</p>
              <p className="text-3xl font-bold text-[#00F5A0] mt-2">{todayAppointments.length}</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Próximas</p>
              <p className="text-3xl font-bold text-[#00D9FF] mt-2">{pendingAppointments}</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Consultas</p>
              <p className="text-3xl font-bold text-purple-400 mt-2">{recentVisits.length}</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Seguimientos</p>
              <p className="text-3xl font-bold text-pink-400 mt-2">{activeFollowUps}</p>
            </div>
          </div>

          {alerts.length > 0 && (
            <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-amber-400">notification_important</span>
                <h2 className="text-lg font-semibold text-amber-400">Alertas de Seguimiento</h2>
              </div>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-100">{alert.patient.name}</p>
                      <p className="text-sm text-slate-500">{alert.prescription?.productName} · {alert.alertReason || "Alerta activada"}</p>
                    </div>
                    <Link href="/followups" className="rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors">
                      Ver
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Citas de Hoy</h2>
              {todayAppointments.length > 0 && (
                <span className="text-xs text-slate-500">{todayAppointments.length} paciente{todayAppointments.length > 1 ? "s" : ""}</span>
              )}
            </div>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">event_available</span>
                <p className="text-slate-500">No tienes citas programadas para hoy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appt) => (
                  <div key={appt.id} className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        appt.status === "CONFIRMED" ? "bg-[#00F5A0]/10" : "bg-amber-400/10"
                      }`}>
                        <span className={`material-symbols-outlined ${
                          appt.status === "CONFIRMED" ? "text-[#00F5A0]" : "text-amber-400"
                        }`}>
                          {appt.status === "CONFIRMED" ? "check_circle" : "schedule"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{appt.patient.name}</p>
                        {appt.reason && <p className="text-xs text-slate-500">{appt.reason}</p>}
                        {appt.patient.notes && <p className="text-xs text-amber-400 mt-1">⚠️ {appt.patient.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-100">{appt.time}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        appt.status === "CONFIRMED" ? "bg-[#00F5A0]/10 text-[#00F5A0]" : "bg-amber-400/10 text-amber-400"
                      }`}>
                        {appt.status === "CONFIRMED" ? "Confirmada" : "Pendiente"}
                      </span>
                      <Link
                        href={`/patients/${appt.patient.id}`}
                        className="rounded-lg p-2 text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-colors"
                        title="Ver historial"
                      >
                        <span className="material-symbols-outlined text-lg">history</span>
                      </Link>
                      <Link
                        href="/consultations"
                        className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[#00F5A0]/10 text-[#00F5A0] hover:bg-[#00F5A0]/20 transition-colors"
                      >
                        Iniciar consulta
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Consultas Recientes</h2>
            {recentVisits.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Sin consultas registradas</p>
            ) : (
              <div className="space-y-2">
                {recentVisits.map((visit) => (
                  <div key={visit.id} className="rounded-xl bg-[#0A0C10] border border-[#30363D] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-purple-400">medical_services</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100">{visit.patient.name}</p>
                        <p className="text-xs text-slate-500">{visit.diagnosis || "Sin diagnóstico"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-slate-600">{new Date(visit.visitDate).toLocaleDateString("es-ES")}</p>
                      <Link href={`/patients/${visit.patient.id}`} className="text-xs text-[#00D9FF] hover:underline">Ver historial →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Link href="/appointments" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#00F5A0]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#00F5A0]">calendar_month</span>
                <h3 className="text-lg font-semibold text-slate-100">Gestionar Citas</h3>
              </div>
              <p className="text-sm text-slate-500">Programa, confirma y cancela citas médicas</p>
              <p className="text-xs text-[#00F5A0] mt-3 group-hover:underline">Ir a citas →</p>
            </Link>

            <Link href="/followups" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#00D9FF]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#00D9FF]">monitor_heart</span>
                <h3 className="text-lg font-semibold text-slate-100">Seguimiento</h3>
              </div>
              <p className="text-sm text-slate-500">Monitorea la adherencia y estado de pacientes</p>
              <p className="text-xs text-[#00D9FF] mt-3 group-hover:underline">Ir a seguimiento →</p>
            </Link>

            <Link href="/whatsapp" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#25D366]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#25D366]">chat</span>
                <h3 className="text-lg font-semibold text-slate-100">WhatsApp</h3>
              </div>
              <p className="text-sm text-slate-500">Conversaciones con pacientes vía IA</p>
              <p className="text-xs text-[#25D366] mt-3 group-hover:underline">Ir a WhatsApp →</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
