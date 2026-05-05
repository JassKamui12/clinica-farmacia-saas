import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const DEFAULT_DOCTOR_EMAIL = "doctor@clinica.local";
const DEFAULT_DOCTOR_NAME = "Dr. Médico";

async function getDefaultDoctor() {
  return prisma.user.upsert({
    where: { email: DEFAULT_DOCTOR_EMAIL },
    update: { name: DEFAULT_DOCTOR_NAME },
    create: {
      email: DEFAULT_DOCTOR_EMAIL,
      name: DEFAULT_DOCTOR_NAME,
      role: "DOCTOR",
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status) where.billingStatus = status;

  const prescriptions = await prisma.prescription.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { patient: true, doctor: true },
  });

  return NextResponse.json(prescriptions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.patientId || !body.productName) {
    return NextResponse.json(
      { error: "El paciente y el producto son obligatorios." },
      { status: 400 }
    );
  }

  const doctor = body.doctorId
    ? await prisma.user.findUnique({ where: { id: body.doctorId } })
    : await getDefaultDoctor();

  const prescription = await prisma.prescription.create({
    data: {
      patient: { connect: { id: body.patientId } },
      doctor: { connect: { id: doctor?.id ?? (await getDefaultDoctor()).id } },
      productName: body.productName,
      dosage: body.dosage,
      instructions: body.instructions,
      notes: body.notes,
      quantity: body.quantity || 1,
      totalPrice: body.totalPrice || 0,
    },
  });

  await prisma.notification.create({
    data: {
      title: "Nueva receta generada",
      content: `El doctor ${doctor?.name ?? "Doctor"} generó una receta de ${body.productName} para ${body.patientName || "un paciente"}.`,
      channel: "in_app",
      role: "PHARMACIST",
    },
  });

  return NextResponse.json(prescription, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "ID de receta requerido" }, { status: 400 });
  }

  const updateData: any = {};
  if (body.billingStatus) updateData.billingStatus = body.billingStatus;
  if (body.quantity !== undefined) updateData.quantity = body.quantity;
  if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice;
  if (body.notes !== undefined) updateData.notes = body.notes;

  const prescription = await prisma.prescription.update({
    where: { id: body.id },
    data: updateData,
  });

  return NextResponse.json(prescription);
}
