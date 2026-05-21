import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/whatsapp/sessions?phone=XXXX
 * Returns ownerTakenOver status for the given phone number.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone es requerido" }, { status: 400 });
  }

  const waSession = await prisma.whatsAppSession.findUnique({
    where: { phone },
    select: { ownerTakenOver: true, ownerLastMessageAt: true },
  });

  return NextResponse.json({
    ownerTakenOver: waSession?.ownerTakenOver ?? false,
    ownerLastMessageAt: waSession?.ownerLastMessageAt ?? null,
  });
}
