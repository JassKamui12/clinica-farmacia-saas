import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isBotRequest } from "@/lib/botAuth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saveSchema = z.object({
  clinicId: z.string(),
  phone: z.string(),
  role: z.enum(["user", "assistant", "owner"]),
  content: z.string(),
  patientId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // El bot-service puede leer mensajes sin auth de usuario
    const isBot = isBotRequest(req);
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const patientId = searchParams.get("patientId");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const clinicId = searchParams.get("clinicId");

    let resolvedClinicId: string | null | undefined;

    if (isBot) {
      resolvedClinicId = clinicId;
    } else {
      const session = await requireAuth();
      resolvedClinicId = session.clinicId;
    }

    const where: Record<string, unknown> = {};
    if (resolvedClinicId) where.clinicId = resolvedClinicId;
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

// El bot-service guarda mensajes directamente via POST
export async function POST(req: NextRequest) {
  if (!isBotRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { clinicId, phone, role, content, patientId } = parsed.data;

    const message = await prisma.whatsAppMessage.create({
      data: { clinicId, phone, role, content, patientId: patientId ?? null },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
