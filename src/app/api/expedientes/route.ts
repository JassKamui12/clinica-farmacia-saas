import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string(),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = 20;

    const where: Record<string, unknown> = { clinicId: session.clinicId };
    if (patientId) where.patientId = patientId;

    const [expedientes, total] = await Promise.all([
      prisma.clinicalVisit.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true, specialty: true } },
          prescriptions: {
            select: { id: true, status: true, medications: true },
            take: 1,
          },
        },
        orderBy: { visitDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.clinicalVisit.count({ where }),
    ]);

    return NextResponse.json({ expedientes, total, page, pages: Math.ceil(total / limit) });
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

    const expediente = await prisma.clinicalVisit.create({
      data: {
        clinicId: session.clinicId!,
        doctorId: session.userId,
        patientId: parsed.data.patientId,
        symptoms: parsed.data.symptoms || null,
        diagnosis: parsed.data.diagnosis || null,
        treatment: parsed.data.treatment || null,
        notes: parsed.data.notes || null,
      },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(expediente, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
