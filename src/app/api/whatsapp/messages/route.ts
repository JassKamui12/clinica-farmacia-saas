import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const patientId = searchParams.get("patientId");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const where: Record<string, unknown> = { clinicId: session.clinicId };
    if (phone) where.phone = phone;
    if (patientId) where.patientId = patientId;

    const messages = await prisma.whatsAppMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return NextResponse.json(messages);
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
