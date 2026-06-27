import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string(),
  visitId: z.string().optional(),
  medications: z.array(z.object({
    nombre: z.string(),
    dosis: z.string().optional(),
    frecuencia: z.string().optional(),
    duracion: z.string().optional(),
    cantidad: z.number().optional(),
  })).min(1),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  expiresInDays: z.number().default(30),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = 20;

    const where: Record<string, unknown> = { clinicId: session.clinicId };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [recetas, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          doctor: { select: { id: true, name: true, specialty: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prescription.count({ where }),
    ]);

    return NextResponse.json({ recetas, total, page, pages: Math.ceil(total / limit) });
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

    const { patientId, visitId, medications, diagnosis, notes, expiresInDays } = parsed.data;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Primer check-in de adherencia a los 3 días de emitida la receta.
    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + 3);

    const receta = await prisma.prescription.create({
      data: {
        clinicId: session.clinicId!,
        patientId,
        doctorId: session.userId,
        visitId: visitId ?? null,
        medications,
        diagnosis: diagnosis ?? null,
        notes: notes ?? null,
        expiresAt,
        status: "ACTIVE",
        followUp: {
          create: {
            clinicId: session.clinicId!,
            patientId,
            startDate: new Date(),
            endDate: expiresAt,
            nextCheckIn,
            status: "ACTIVE",
          },
        },
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(receta, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
