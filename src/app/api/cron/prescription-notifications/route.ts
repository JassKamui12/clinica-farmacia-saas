import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTextMessage } from "@/lib/whatsapp";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const pendingPrescriptions = await prisma.prescription.findMany({
    where: { whatsappSent: false, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    include: {
      Patient: true,
      User: { select: { name: true } },
    },
  });

  const results = [];

  for (const prescription of pendingPrescriptions) {
    const patient = prescription.Patient;
    const phone = patient.whatsappPhone || patient.phone;

    if (!phone) {
      results.push({
        prescriptionId: prescription.id,
        status: "skipped",
        reason: "No phone number",
      });
      continue;
    }

    const body = `💊 *Receta Generada*\n\nHola ${patient.name}, el Dr/Dra. ${prescription.User?.name || "médico"} ha generado una receta:\n\n💊 ${prescription.productName}\n📋 ${prescription.dosage || ""}\n📝 ${prescription.instructions || ""}\n\nPuedes pasar por la farmacia.`;

    const result = await sendTextMessage({
      phone,
      body,
      patientId: patient.id,
    });

    await prisma.prescription.update({
      where: { id: prescription.id },
      data: { whatsappSent: true },
    });

    results.push({
      prescriptionId: prescription.id,
      phone,
      status: result.success ? "sent" : "failed",
    });
  }

  return NextResponse.json({
    type: "prescription_notifications",
    total: pendingPrescriptions.length,
    results,
  });
}
