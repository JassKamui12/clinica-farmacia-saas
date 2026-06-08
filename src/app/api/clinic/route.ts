import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session.clinicId) return NextResponse.json({ error: "Usuario sin clínica asignada" }, { status: 404 });

    const clinic = await prisma.clinic.findUnique({
      where: { id: session.clinicId },
      select: {
        id: true, name: true, rubroId: true, slug: true,
        address: true, city: true, country: true, phone: true,
        isActive: true, plan: true, trialEndsAt: true,
        waPhoneNumberId: true, waVerifyToken: true, waMode: true,
        waAccessToken: true, aiName: true, aiSystemPrompt: true,
      },
    });

    if (!clinic) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 });

    return NextResponse.json({
      ...clinic,
      waAccessToken: clinic.waAccessToken ? "••••••••" : null,
      hasWaAccessToken: !!clinic.waAccessToken,
    });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN") throw new AuthError("Solo administradores");
    if (!session.clinicId) return NextResponse.json({ error: "Sin clínica" }, { status: 404 });

    const body = await req.json() as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};

    if (typeof body.name === "string") updateData.name = body.name;
    if (typeof body.address === "string" || body.address === null) updateData.address = body.address;
    if (typeof body.city === "string" || body.city === null) updateData.city = body.city;
    if (typeof body.phone === "string" || body.phone === null) updateData.phone = body.phone;
    if (typeof body.waPhoneNumberId === "string" || body.waPhoneNumberId === null) updateData.waPhoneNumberId = body.waPhoneNumberId;
    if (typeof body.waVerifyToken === "string" || body.waVerifyToken === null) updateData.waVerifyToken = body.waVerifyToken;
    if (typeof body.waMode === "string" && ["META", "BAILEYS"].includes(body.waMode)) updateData.waMode = body.waMode;
    if (typeof body.waAccessToken === "string" && body.waAccessToken !== "••••••••") {
      updateData.waAccessToken = body.waAccessToken || null;
    }
    if (typeof body.aiName === "string") updateData.aiName = body.aiName;
    if (typeof body.aiSystemPrompt === "string" || body.aiSystemPrompt === null) updateData.aiSystemPrompt = body.aiSystemPrompt;

    const updated = await prisma.clinic.update({ where: { id: session.clinicId }, data: updateData });
    return NextResponse.json({ success: true, id: updated.id });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
