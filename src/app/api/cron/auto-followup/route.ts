import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTextMessage } from "@/lib/whatsapp";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const completedVisits = await prisma.clinicalVisit.findMany({
    where: {
      visitDate: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        lte: new Date(),
      },
    },
    include: {
      Patient: true,
    },
  });

  const results = [];

  for (const visit of completedVisits) {
    const existingFollowUp = await prisma.patientFollowUp.findFirst({
      where: {
        patientId: visit.patientId,
        status: "ACTIVE",
        createdAt: { gte: visit.visitDate },
      },
    });

    if (existingFollowUp) {
      results.push({
        patientId: visit.patientId,
        status: "skipped",
        reason: "Follow-up already exists",
      });
      continue;
    }

    const newFollowUp = await prisma.patientFollowUp.create({
      data: {
        patientId: visit.patientId,
        startDate: new Date(),
        nextCheckIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        notes: `Seguimiento automático post-consulta: ${visit.diagnosis || "Sin diagnóstico"}`,
      },
    });

    const patient = visit.Patient;
    const phone = patient.whatsappPhone || patient.phone;

    if (phone && visit.treatment) {
      const treatment = visit.treatment.length > 50 ? visit.treatment.substring(0, 50) + "..." : visit.treatment;

      await sendTextMessage({
        phone,
        body: `Hola ${patient.name}, hemos registrado tu consulta de hoy.\n\n📋 Tratamiento: ${treatment}\n\nTe contactaremos en 3 días para hacer seguimiento. ¡Recupérate pronto! 💪`,
        patientId: patient.id,
      });
    }

    results.push({
      patientId: visit.patientId,
      followUpId: newFollowUp.id,
      status: "created",
    });
  }

  return NextResponse.json({
    type: "auto_followup",
    total: completedVisits.length,
    results,
  });
}
