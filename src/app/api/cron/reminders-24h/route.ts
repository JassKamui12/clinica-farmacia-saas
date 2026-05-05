import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendTextMessage,
  sendTemplateMessage,
} from "@/lib/whatsapp";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const appointments24h = await prisma.appointment.findMany({
    where: {
      date: {
        gte: new Date(`${tomorrowStr}T00:00:00`),
        lt: new Date(`${tomorrowStr}T23:59:59`),
      },
      status: { in: ["PENDING", "CONFIRMED"] },
      whatsappReminder24h: false,
    },
    include: {
      patient: true,
      doctor: { select: { name: true } },
    },
  });

  const results = [];

  for (const appointment of appointments24h) {
    const patient = appointment.patient;
    const phone = patient.whatsappPhone || patient.phone;

    if (!phone) {
      results.push({
        appointmentId: appointment.id,
        status: "skipped",
        reason: "No phone number",
      });
      continue;
    }

    const dateStr = appointment.date.toLocaleDateString("es-ES", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const body = `🏥 *Recordatorio de Cita*\n\nHola ${patient.name}, tienes una cita mañana:\n\n📅 ${dateStr}\n⏰ ${appointment.time}\n👨‍⚕️ ${appointment.doctor.name || "Doctor asignado"}\n\nResponde "confirmo" o "cancelo" para gestionar tu cita.`;

    const result = await sendTextMessage({
      phone,
      body,
      patientId: patient.id,
    });

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { whatsappReminder24h: true },
    });

    results.push({
      appointmentId: appointment.id,
      phone,
      status: result.success ? "sent" : "failed",
    });
  }

  return NextResponse.json({
    type: "reminder_24h",
    total: appointments24h.length,
    results,
  });
}
