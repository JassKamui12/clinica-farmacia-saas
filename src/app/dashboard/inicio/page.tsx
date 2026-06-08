import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InicioDashboard from "./InicioDashboard";

export default async function InicioPage() {
  const session = await requireAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const clinicId = session.clinicId;
  if (!clinicId) return null;

  const [citasHoy, totalPacientes, citasPendientes, expedientesHoy] = await Promise.all([
    prisma.appointment.count({
      where: { clinicId, date: { gte: today, lt: tomorrow } },
    }),
    prisma.patient.count({ where: { clinicId } }),
    prisma.appointment.count({
      where: { clinicId, status: "PENDING", date: { gte: today } },
    }),
    prisma.clinicalVisit.count({
      where: { clinicId, visitDate: { gte: today, lt: tomorrow } },
    }),
  ]).catch(() => [0, 0, 0, 0]);

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { name: true, rubroId: true, plan: true, trialEndsAt: true },
  }).catch(() => null);

  return (
    <InicioDashboard
      stats={{ citasHoy, totalPacientes, citasPendientes, expedientesHoy }}
      clinic={clinic}
    />
  );
}
