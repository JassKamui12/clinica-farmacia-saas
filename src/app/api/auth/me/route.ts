import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getValidSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuperAdmin: true,
        specialty: true,
        logoUrl: true,
        whatsappPhone: true,
        clinicId: true,
        clinic: {
          select: {
            id: true,
            name: true,
            rubroId: true,
            plan: true,
            trialEndsAt: true,
            slug: true,
            logoUrl: true,
            whatsappPhone: true,
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
