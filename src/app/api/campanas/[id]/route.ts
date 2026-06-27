import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  messageTemplate: z.string().min(10).optional(),
  audienceType: z.enum(["inactive", "all"]).optional(),
  inactiveMonths: z.number().int().min(1).max(60).optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
  status: z.enum(["DRAFT", "SCHEDULED", "CANCELLED"]).optional(),
});

async function owned(id: string, clinicId: string) {
  return prisma.healthCampaign.findFirst({ where: { id, clinicId }, select: { id: true } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 400 });
    }
    if (!(await owned(id, session.clinicId!))) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    const { scheduledFor, ...rest } = parsed.data;
    const campana = await prisma.healthCampaign.update({
      where: { id },
      data: {
        ...rest,
        ...(scheduledFor !== undefined ? { scheduledFor: scheduledFor ? new Date(scheduledFor) : null } : {}),
      },
    });
    return NextResponse.json(campana);
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    if (!(await owned(id, session.clinicId!))) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }
    await prisma.healthCampaign.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
