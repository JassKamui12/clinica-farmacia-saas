import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const roleParam = request.nextUrl.searchParams.get("role");
  const validRoles = ["ADMIN", "DOCTOR", "PHARMACIST"] as const;
  const role = validRoles.includes(roleParam as any)
    ? (roleParam as typeof validRoles[number])
    : undefined;

  const where = role ? { role } : undefined;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notifications);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const id = body.id;

  if (!id) {
    return NextResponse.json({ error: "Id de notificación requerido." }, { status: 400 });
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json(notification);
}
