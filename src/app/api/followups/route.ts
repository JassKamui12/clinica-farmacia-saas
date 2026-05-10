import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createFollowUpSchema = z.object({
  patientId: z.string().min(1),
  prescriptionId: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

const updateFollowUpSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "COMPLETED", "NON_ADHERENT", "ALERT"]).optional(),
  adherenceScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  alertTriggered: z.boolean().optional(),
  alertReason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const status = searchParams.get("status");
  const alertTriggered = searchParams.get("alertTriggered");

  const where: Record<string, unknown> = {};
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;
  if (alertTriggered === "true") where.alertTriggered = true;

  const followUps = await prisma.patientFollowUp.findMany({
    where,
    include: {
      Patient: { select: { id: true, name: true, whatsappPhone: true } },
      Prescription: { select: { id: true, productName: true, dosage: true } },
    },
    orderBy: { nextCheckIn: "asc" },
  });

  return NextResponse.json(
    followUps.map(({ Patient, Prescription, ...rest }) => ({ ...rest, patient: Patient, prescription: Prescription }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const validation = createFollowUpSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { patientId, prescriptionId, startDate, endDate, notes } = validation.data;

  const followUp = await prisma.patientFollowUp.create({
    data: {
      patientId,
      prescriptionId: prescriptionId || null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      nextCheckIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: notes || null,
    },
    include: {
      Patient: { select: { name: true, whatsappPhone: true } },
      Prescription: { select: { productName: true, dosage: true } },
    },
  });

  const { Patient, Prescription, ...fuRest } = followUp;
  return NextResponse.json({ ...fuRest, patient: Patient, prescription: Prescription }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const validation = updateFollowUpSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { id, status, adherenceScore, notes, alertTriggered, alertReason } = validation.data;

  const followUp = await prisma.patientFollowUp.update({
    where: { id },
    data: {
      status: status || undefined,
      adherenceScore: adherenceScore ?? undefined,
      notes: notes !== undefined ? notes : undefined,
      alertTriggered: alertTriggered ?? undefined,
      alertReason: alertReason !== undefined ? alertReason : undefined,
      lastCheckIn: new Date(),
      ...(status ? { nextCheckIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) } : {}),
    },
    include: {
      Patient: { select: { name: true, whatsappPhone: true } },
      Prescription: { select: { productName: true } },
    },
  });

  const { Patient, Prescription, ...fuRest } = followUp;
  return NextResponse.json({ ...fuRest, patient: Patient, prescription: Prescription });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  await prisma.patientFollowUp.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({ success: true });
}
