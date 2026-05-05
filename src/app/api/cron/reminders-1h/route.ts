import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTextMessage } from "@/lib/whatsapp";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();

  const appointments1h = await prisma.appointment.findMany({
    where: {
      date: {
        gte: now,
        lt: new Date(now.getTime() + 60 * 60 * 1000),
      },
      status: { in: ["PENDING", "CONFIRMED"] },
      whatsappReminder1h: false,
    },
    include: {
      patient: true,
    },
  });

  const results = [];

  for (const appointment of appointments1h) {
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

    const body = `⏰ *Tu cita es en 1 hora*\n\nHola ${patient.name}, te esperamos a las ${appointment.time}.\n\n📍 No olvides llegar 10 minutos antes.`;

    const result = await sendTextMessage({
      phone,
      body,
      patientId: patient.id,
    });

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { whatsappReminder1h: true },
    });

    results.push({
      appointmentId: appointment.id,
      phone,
      status: result.success ? "sent" : "failed",
    });
  }

  return NextResponse.json({
    type: "reminder_1h",
    total: appointments1h.length,
    results,
  });
}
