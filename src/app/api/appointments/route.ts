import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, "Paciente requerido"),
  doctorId: z.string().min(1, "Doctor requerido"),
  date: z.string().min(1, "Fecha requerida"),
  time: z.string().min(1, "Hora requerida"),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const patientId = searchParams.get("patientId");
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {};

  if ((session.user as any).role === "DOCTOR" && !doctorId) {
    where.doctorId = (session.user as any).id;
  } else if (doctorId) {
    where.doctorId = doctorId;
  }
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  }
  if (startDate && endDate) {
    where.date = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      Patient: { select: { id: true, name: true, whatsappPhone: true, phone: true, email: true } },
      User: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const validation = createAppointmentSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { patientId, doctorId, date, time, reason, notes } = validation.data;

  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const [timeHour, timeMinute] = time.split(":").map(Number);
  if (timeHour < 7 || timeHour > 19) {
    return NextResponse.json(
      { error: "Horario fuera de rango (7:00 - 19:00)" },
      { status: 400 }
    );
  }

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId,
      date: appointmentDate,
      time,
      status: { not: "CANCELLED" },
    },
  });

  if (existingAppointment) {
    return NextResponse.json(
      { error: "El doctor ya tiene una cita programada en ese horario" },
      { status: 409 }
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      date: appointmentDate,
      time,
      reason: reason || null,
      notes: notes || null,
    },
    include: {
      Patient: { select: { name: true, whatsappPhone: true } },
      User: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const validation = updateAppointmentSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { id, status, notes } = validation.data;

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      status: status || undefined,
      notes: notes !== undefined ? notes : undefined,
      ...(status === "CONFIRMED" ? { whatsappConfirmed: true } : {}),
    },
    include: {
      Patient: { select: { name: true, whatsappPhone: true } },
      User: { select: { name: true } },
    },
  });

  return NextResponse.json(appointment);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID de cita requerido" }, { status: 400 });
  }

  await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true, message: "Cita cancelada" });
}
