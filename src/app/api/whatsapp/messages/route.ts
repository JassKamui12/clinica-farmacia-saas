import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMessagesByPhone } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const patientId = searchParams.get("patientId");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (phone) {
    const messages = await getMessagesByPhone(phone, limit);
    return NextResponse.json(messages);
  }

  if (patientId) {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { patientId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    return NextResponse.json(messages);
  }

  const messages = await prisma.whatsAppMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { patient: { select: { name: true, whatsappPhone: true } } },
  });

  return NextResponse.json(messages);
}
