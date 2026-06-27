import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendChannelMessage } from "@/lib/whatsapp-channel";
import { runCampaign } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

// Combina date (DateTime a medianoche del día) + time ("HH:MM") en el instante real de la cita.
function appointmentStart(date: Date, time: string): Date {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  const d = new Date(date);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function patientPhone(p: {
  phone: string | null;
  realPhone: string | null;
  whatsappPhone: string | null;
}): string | null {
  return p.realPhone || p.phone || p.whatsappPhone || null;
}

async function logOutgoing(clinicId: string, patientId: string, phone: string, content: string) {
  await prisma.whatsAppMessage.create({
    data: { clinicId, patientId, phone, role: "assistant", content },
  });
}

async function processReminders() {
  const now = new Date();

  // El campo `date` está a medianoche del día de la cita; filtramos por día y afinamos por hora en JS.
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const dateUpper = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const citas = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      date: { gte: startOfToday, lte: dateUpper },
      OR: [{ whatsappReminder24h: false }, { whatsappReminder1h: false }],
    },
    include: {
      patient: {
        select: { id: true, name: true, phone: true, realPhone: true, whatsappPhone: true },
      },
      doctor: { select: { name: true } },
      clinic: { select: { id: true, name: true } },
    },
  });

  let sent24 = 0;
  let sent1 = 0;
  let skipped = 0;

  for (const c of citas) {
    const phone = patientPhone(c.patient);
    if (!phone) {
      skipped++;
      continue;
    }

    const start = appointmentStart(c.date, c.time);
    const hoursToStart = (start.getTime() - now.getTime()) / 3_600_000;

    // Recordatorio 1h: la cita arranca dentro de los próximos 90 min.
    if (!c.whatsappReminder1h && hoursToStart > 0 && hoursToStart <= 1.5) {
      const msg =
        `⏰ Recordatorio: tu cita en ${c.clinic.name} es hoy a las ${c.time}` +
        (c.doctor?.name ? ` con ${c.doctor.name}` : "") +
        `. ¡Te esperamos! 🩺`;
      const r = await sendChannelMessage(c.clinicId, phone, msg);
      if (r.success) {
        await prisma.appointment.update({ where: { id: c.id }, data: { whatsappReminder1h: true } });
        await logOutgoing(c.clinicId, c.patient.id, phone, msg);
        sent1++;
      }
      continue;
    }

    // Recordatorio 24h: la cita arranca entre ~20h y 26h. Pide confirmar.
    if (!c.whatsappReminder24h && hoursToStart > 1.5 && hoursToStart <= 26) {
      const fecha = start.toLocaleDateString("es-HN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const msg =
        `Hola ${c.patient.name} 👋\n\n` +
        `Te recordamos tu cita en ${c.clinic.name}:\n` +
        `📅 ${fecha}\n` +
        `🕐 ${c.time}` +
        (c.doctor?.name ? `\n👨‍⚕️ ${c.doctor.name}` : "") +
        `\n\nResponde *CONFIRMAR* para confirmar tu asistencia o *CANCELAR* si no podrás asistir.`;
      const r = await sendChannelMessage(c.clinicId, phone, msg);
      if (r.success) {
        await prisma.appointment.update({ where: { id: c.id }, data: { whatsappReminder24h: true } });
        await logOutgoing(c.clinicId, c.patient.id, phone, msg);
        sent24++;
      }
    }
  }

  return { processed: citas.length, sent24, sent1, skipped };
}

// Check-ins de adherencia: seguimientos ACTIVE cuyo nextCheckIn ya venció.
async function processFollowUps() {
  const now = new Date();

  const followUps = await prisma.patientFollowUp.findMany({
    where: { status: "ACTIVE", nextCheckIn: { lte: now } },
    include: {
      patient: {
        select: { id: true, name: true, phone: true, realPhone: true, whatsappPhone: true },
      },
      clinic: { select: { name: true } },
    },
  });

  let checkins = 0;
  let completed = 0;
  let skipped = 0;

  for (const f of followUps) {
    // Si el tratamiento ya terminó, cerramos el seguimiento.
    if (f.endDate && f.endDate <= now) {
      await prisma.patientFollowUp.update({ where: { id: f.id }, data: { status: "COMPLETED" } });
      completed++;
      continue;
    }

    const phone = patientPhone(f.patient);
    if (!phone) {
      skipped++;
      continue;
    }

    const msg =
      `Hola ${f.patient.name} 👋\n\n` +
      `Desde ${f.clinic.name} damos seguimiento a tu tratamiento. ¿Cómo te has sentido?\n\n` +
      `Cuéntanos si has tomado tus medicamentos según lo indicado o si tienes alguna molestia. ` +
      `Estamos para ayudarte. 🩺`;

    const r = await sendChannelMessage(f.clinicId, phone, msg);
    if (r.success) {
      const next = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // próximo check-in en 3 días
      await prisma.patientFollowUp.update({
        where: { id: f.id },
        data: { lastCheckIn: now, nextCheckIn: next },
      });
      await logOutgoing(f.clinicId, f.patient.id, phone, msg);
      checkins++;
    }
  }

  return { followUpsProcessed: followUps.length, checkins, completed, skipped };
}

// Campañas de salud programadas cuya fecha ya llegó.
async function processCampaigns() {
  const now = new Date();
  const campanas = await prisma.healthCampaign.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: now } },
  });

  let totalSent = 0;
  for (const c of campanas) {
    const { sent } = await runCampaign(c);
    totalSent += sent;
  }
  return { campaignsRun: campanas.length, totalSent };
}

function authorized(req: NextRequest): boolean {
  if (!CRON_SECRET) return false;
  // Vercel Cron envía Authorization: Bearer <CRON_SECRET>.
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${CRON_SECRET}`) return true;
  // Alternativa para schedulers externos / pruebas manuales: ?secret=...
  return new URL(req.url).searchParams.get("secret") === CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  // Cada fase se aísla: que una falle (p.ej. tabla aún no migrada) no debe
  // impedir el envío de recordatorios.
  async function safe<T>(fn: () => Promise<T>): Promise<T | { error: string }> {
    try {
      return await fn();
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  const reminders = await safe(processReminders);
  const followUps = await safe(processFollowUps);
  const campaigns = await safe(processCampaigns);
  return NextResponse.json({ ok: true, reminders, followUps, campaigns });
}
