import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTextMessage } from "@/lib/whatsapp";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();

  const dueFollowUps = await prisma.patientFollowUp.findMany({
    where: {
      status: "ACTIVE",
      nextCheckIn: { lte: now },
    },
    include: {
      Patient: true,
      Prescription: true,
    },
  });

  const results = [];

  for (const followUp of dueFollowUps) {
    const patient = followUp.Patient;
    const phone = patient.whatsappPhone || patient.phone;

    if (!phone) {
      results.push({
        followUpId: followUp.id,
        status: "skipped",
        reason: "No phone number",
      });
      continue;
    }

    const medication = followUp.Prescription?.productName || "tu tratamiento";

    const body = `📋 *Seguimiento de Tratamiento*\n\nHola ${patient.name}, ¿cómo te sientes con ${medication}?\n\nResponde:\n1️⃣ Todo bien, sin problemas\n2️⃣ Molestias leves\n3️⃣ Efectos adversos\n4️⃣ No he podido tomarlo`;

    const result = await sendTextMessage({
      phone,
      body,
      patientId: patient.id,
    });

    await prisma.patientFollowUp.update({
      where: { id: followUp.id },
      data: { lastCheckIn: now },
    });

    results.push({
      followUpId: followUp.id,
      phone,
      status: result.success ? "sent" : "failed",
    });
  }

  return NextResponse.json({
    type: "followup_check",
    total: dueFollowUps.length,
    results,
  });
}
