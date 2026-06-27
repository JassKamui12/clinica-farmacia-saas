import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3),
  messageTemplate: z.string().min(10),
  audienceType: z.enum(["inactive", "all"]).default("inactive"),
  inactiveMonths: z.number().int().min(1).max(60).default(6),
  scheduledFor: z.string().datetime().optional().nullable(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const campanas = await prisma.healthCampaign.findMany({
      where: { clinicId: session.clinicId! },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campanas);
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 400 });
    }
    const { scheduledFor, ...rest } = parsed.data;

    const campana = await prisma.healthCampaign.create({
      data: {
        clinicId: session.clinicId!,
        ...rest,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: scheduledFor ? "SCHEDULED" : "DRAFT",
      },
    });
    return NextResponse.json(campana, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
