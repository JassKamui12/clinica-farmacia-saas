import { NextRequest, NextResponse } from "next/server";
import { getBaileysStatus, getBaileysQR } from "@/lib/whatsapp-channel";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") ?? "status";

    if (action === "qr") {
      const qr = await getBaileysQR();
      return NextResponse.json(qr ?? { qr: null });
    }

    const status = await getBaileysStatus();
    return NextResponse.json(status);
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.clinicId) return NextResponse.json({ error: "Sin clínica" }, { status: 400 });

    const body = await req.json();
    const { action } = body;

    if (action === "set-mode") {
      const { mode } = body;
      if (!["META", "BAILEYS"].includes(mode)) {
        return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
      }
      await prisma.clinic.update({ where: { id: session.clinicId }, data: { waMode: mode } });
      return NextResponse.json({ success: true, mode });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
