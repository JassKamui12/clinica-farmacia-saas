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

  const [todayAppointments, pendingAppointments, recentVisits, activeFollowUps, alerts] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId, date: { gte: today, lt: tomorrow }, status: { in: ["PENDING", "CONFIRMED"] } },
      include: { Patient: { select: { id: true, name: true, whatsappPhone: true, notes: true } } },
      orderBy: { time: "asc" },
    }),
    prisma.appointment.count({
      where: { doctorId, date: { gte: tomorrow }, status: { in: ["PENDING", "CONFIRMED"] } },
    }),
    prisma.clinicalVisit.findMany({
      where: { doctorId },
      include: { Patient: { select: { id: true, name: true } } },
      orderBy: { visitDate: "desc" },
      take: 5,
    }),
    prisma.patientFollowUp.count({ where: { status: "ACTIVE", Prescription: { doctorId } } }),
    prisma.patientFollowUp.findMany({
      where: { alertTriggered: true, status: "ALERT" },
      include: {
        Patient: { select: { name: true, whatsappPhone: true } },
        Prescription: { select: { productName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const todayStr = today.toLocaleDateString("es-ES", { weekday: "long", month: "long", day: "numeric" });

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/doctor" userRole="DOCTOR" userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Buenos días, {session.user.name}</h1>
              <p className="text-slate-500 text-sm mt-1 capitalize">{todayStr}</p>
            </div>
            <Link href="/consultations" className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
              <span className="material-symbols-outlined text-lg">medical_services</span>
              Nueva Consulta
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Citas hoy</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{todayAppointments.length}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Próximas</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{pendingAppointments}</p>
            </div>
            <div className="bg-violet-50 rounded-2xl border border-violet-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Consultas</p>
              <p className="text-3xl font-bold text-violet-600 mt-2">{recentVisits.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Seguimientos</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{activeFollowUps}</p>
            </div>
          </div>

          {alerts.length > 0 && (
            <section className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-amber-600">notification_important</span>
                <h2 className="text-base font-semibold text-amber-800">Alertas de Seguimiento</h2>
              </div>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="bg-white rounded-xl border border-amber-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{alert.Patient?.name}</p>
                      <p className="text-xs text-slate-500">{alert.Prescription?.productName} · {alert.alertReason || "Alerta activada"}</p>
                    </div>
                    <Link href={`/patients/${alert.patientId}`} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                      Ver paciente
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Citas de Hoy</h2>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">event_available</span>
                <p className="text-slate-500">No tienes citas programadas para hoy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appt) => (
                  <div key={appt.id} className={`rounded-xl border p-4 flex items-center justify-between ${appt.status === "CONFIRMED" ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${appt.status === "CONFIRMED" ? "bg-emerald-100" : "bg-amber-100"}`}>
                        <span className={`material-symbols-outlined ${appt.status === "CONFIRMED" ? "text-emerald-600" : "text-amber-600"}`}>
                          {appt.status === "CONFIRMED" ? "check_circle" : "schedule"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{appt.Patient?.name}</p>
                        {appt.reason && <p className="text-xs text-slate-500">{appt.reason}</p>}
                        {appt.Patient?.notes && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-amber-500 text-sm">warning</span>
                            <p className="text-xs text-amber-700">{appt.Patient?.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-slate-900">{appt.time}</span>
                      {appt.Patient?.whatsappPhone && (
                        <span className="text-xs text-emerald-600 font-medium">📱 {appt.Patient?.whatsappPhone}</span>
                      )}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${appt.status === "CONFIRMED" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                        {appt.status === "CONFIRMED" ? "Confirmada" : "Pendiente"}
                      </span>
                      <Link href={`/patients/${appt.patientId}`} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors" title="Ver historial">
                        <span className="material-symbols-outlined text-lg">history</span>
                      </Link>
                      <Link href="/consultations" className="rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                        Iniciar consulta
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Consultas Recientes</h2>
            {recentVisits.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">medical_services</span>
                <p className="text-slate-500">Sin consultas registradas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentVisits.map((visit) => (
                  <div key={visit.id} className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-violet-600">medical_services</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{visit.Patient?.name}</p>
                        <p className="text-xs text-slate-500">{visit.diagnosis || "Sin diagnóstico"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-slate-400">{new Date(visit.visitDate).toLocaleDateString("es-ES")}</p>
                      <Link href={`/patients/${visit.patientId}`} className="text-xs text-blue-600 hover:underline font-medium">Ver historial →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { href: "/appointments", icon: "calendar_month",  color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    title: "Gestionar Citas",  desc: "Programa y confirma citas médicas" },
              { href: "/followups",    icon: "monitor_heart",   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", title: "Seguimiento",      desc: "Monitorea la adherencia de pacientes" },
              { href: "/whatsapp",     icon: "chat",            color: "text-[#25D366]",   bg: "bg-emerald-50", border: "border-emerald-200", title: "WhatsApp",         desc: "Conversaciones con pacientes vía IA" },
            ].map((c) => (
              <Link key={c.href} href={c.href} className={`bg-white rounded-2xl border ${c.border} shadow-sm p-6 hover:shadow-md transition-all group`}>
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <span className={`material-symbols-outlined ${c.color}`}>{c.icon}</span>
                </div>
                <p className="font-semibold text-slate-900">{c.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{c.desc}</p>
                <p className={`text-xs font-medium mt-3 ${c.color} group-hover:underline`}>Abrir →</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
