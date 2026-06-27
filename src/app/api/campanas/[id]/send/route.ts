import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runCampaign } from "@/lib/campaigns";

// Envía la campaña inmediatamente a su audiencia.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const campana = await prisma.healthCampaign.findFirst({
      where: { id, clinicId: session.clinicId! },
    });
    if (!campana) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    const result = await runCampaign(campana);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
