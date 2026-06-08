import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  date: z.string(), // ISO date string
  time: z.string(), // "HH:MM"
  service: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(["manual", "whatsapp", "web"]).default("manual"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = 20;

    const where: Record<string, unknown> = { clinicId: session.clinicId };
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const [citas, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          doctor: { select: { id: true, name: true, specialty: true } },
        },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({ citas, total, page, pages: Math.ceil(total / limit) });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 400 });
    }

    const { patientId, doctorId, date, time, service, reason, notes, source } = parsed.data;

    const cita = await prisma.appointment.create({
      data: {
        clinicId: session.clinicId!,
        patientId,
        doctorId,
        date: new Date(date),
        time,
        service,
        reason,
        notes,
        source,
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true, specialty: true } },
      },
    });

    return NextResponse.json(cita, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
