import { prisma } from "@/lib/prisma";
import { sendChannelMessage } from "@/lib/whatsapp-channel";

function patientPhone(p: {
  phone: string | null;
  realPhone: string | null;
  whatsappPhone: string | null;
}): string | null {
  return p.realPhone || p.phone || p.whatsappPhone || null;
}

interface CampaignLike {
  id: string;
  clinicId: string;
  messageTemplate: string;
  audienceType: string;
  inactiveMonths: number;
}

// Resuelve la audiencia de una campaña: pacientes activos con teléfono.
// - "inactive": sin citas en los últimos N meses (incluye los que nunca agendaron).
// - "all": todos los pacientes activos.
async function getAudience(c: CampaignLike) {
  const baseWhere = { clinicId: c.clinicId, status: "activo" as const };

  if (c.audienceType === "inactive") {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - c.inactiveMonths);
    return prisma.patient.findMany({
      where: { ...baseWhere, appointments: { none: { date: { gte: cutoff } } } },
      select: { id: true, name: true, phone: true, realPhone: true, whatsappPhone: true },
    });
  }

  return prisma.patient.findMany({
    where: baseWhere,
    select: { id: true, name: true, phone: true, realPhone: true, whatsappPhone: true },
  });
}

// Envía la campaña a su audiencia. Devuelve cuántos mensajes se enviaron.
export async function runCampaign(c: CampaignLike): Promise<{ sent: number; audience: number }> {
  const patients = await getAudience(c);
  let sent = 0;

  for (const p of patients) {
    const phone = patientPhone(p);
    if (!phone) continue;

    const firstName = (p.name ?? "").split(" ")[0] || p.name || "";
    const msg = c.messageTemplate.replace(/\{nombre\}/gi, firstName);

    const r = await sendChannelMessage(c.clinicId, phone, msg);
    if (r.success) {
      await prisma.whatsAppMessage.create({
        data: { clinicId: c.clinicId, patientId: p.id, phone, role: "assistant", content: msg },
      });
      sent++;
    }
  }

  await prisma.healthCampaign.update({
    where: { id: c.id },
    data: { status: "SENT", sentCount: { increment: sent }, lastRunAt: new Date() },
  });

  return { sent, audience: patients.length };
}
