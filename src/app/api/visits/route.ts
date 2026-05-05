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

export async function GET() {
  const visits = await prisma.clinicalVisit.findMany({
    orderBy: { visitDate: "desc" },
    include: { patient: true, doctor: true },
  });

  return NextResponse.json(
    visits.map((visit) => ({
      id: visit.id,
      patientId: visit.patientId,
      patientName: visit.patient.name,
      doctorName: visit.doctor.name || visit.doctor.email,
      symptoms: visit.symptoms,
      diagnosis: visit.diagnosis,
      treatment: visit.treatment,
      visitDate: visit.visitDate.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.patientId || !body.symptoms) {
    return NextResponse.json(
      { error: "El paciente y los síntomas son obligatorios." },
      { status: 400 }
    );
  }

  const doctor = body.doctorId
    ? await prisma.user.findUnique({ where: { id: body.doctorId } })
    : await getDefaultDoctor();

  const visit = await prisma.clinicalVisit.create({
    data: {
      patient: { connect: { id: body.patientId } },
      doctor: { connect: { id: doctor?.id ?? (await getDefaultDoctor()).id } },
      symptoms: body.symptoms,
      diagnosis: body.diagnosis,
      treatment: body.treatment,
      notes: body.notes,
    },
  });

  if (body.treatment) {
    await prisma.notification.create({
      data: {
        title: `Tratamiento médico`,
        content: `El doctor ${doctor?.name ?? "Médico"} indicó un tratamiento para el paciente: ${body.treatment}`,
        channel: "in_app",
        role: "PHARMACIST",
      },
    });
  }

  return NextResponse.json(visit, { status: 201 });
}
