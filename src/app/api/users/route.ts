import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, whatsappPhone: true, createdAt: true },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.email || !body.role) {
    return NextResponse.json(
      { error: "name, email y role son obligatorios." },
      { status: 400 }
    );
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      whatsappPhone: body.whatsappPhone,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
