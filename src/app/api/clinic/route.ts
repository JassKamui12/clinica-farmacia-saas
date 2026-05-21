import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function adminOnly(session: any) {
  return session?.user?.role === "ADMIN";
}

/**
 * GET /api/clinic
 * Returns the clinic associated with the current user (by clinicId in session).
 * AI api key is returned as a masked value for display.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const clinicId = (session.user as any).clinicId as string | undefined;
  if (!clinicId) return NextResponse.json({ error: "Usuario sin clínica asignada" }, { status: 404 });

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      id: true,
      name: true,
      type: true,
      slug: true,
      address: true,
      city: true,
      country: true,
      phone: true,
      isActive: true,
      waPhoneNumberId: true,
      waVerifyToken: true,
      aiProvider: true,
      aiModel: true,
      aiName: true,
      aiSystemPrompt: true,
      // Access token + API key — only flag presence, never return raw value
      waAccessToken: true,
      aiApiKey: true,
    },
  });

  if (!clinic) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 });

  return NextResponse.json({
    ...clinic,
    waAccessToken: clinic.waAccessToken ? "••••••••" : null,
    aiApiKey: clinic.aiApiKey ? "••••••••" : null,
    hasWaAccessToken: !!clinic.waAccessToken,
    hasAiApiKey: !!clinic.aiApiKey,
  });
}

/**
 * PUT /api/clinic
 * Updates clinic settings. ADMIN only.
 * Pass waAccessToken or aiApiKey only when changing them; omit to leave unchanged.
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session)) {
    return NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 });
  }

  const clinicId = (session.user as any).clinicId as string | undefined;
  if (!clinicId) return NextResponse.json({ error: "Usuario sin clínica asignada" }, { status: 404 });

  const body = await req.json() as Record<string, unknown>;

  const updateData: Record<string, unknown> = {};

  // Clinic info
  if (typeof body.name === "string") updateData.name = body.name;
  if (typeof body.type === "string") updateData.type = body.type;
  if (typeof body.address === "string" || body.address === null) updateData.address = body.address;
  if (typeof body.city === "string" || body.city === null) updateData.city = body.city;
  if (typeof body.country === "string") updateData.country = body.country;
  if (typeof body.phone === "string" || body.phone === null) updateData.phone = body.phone;

  // WhatsApp config
  if (typeof body.waPhoneNumberId === "string" || body.waPhoneNumberId === null) updateData.waPhoneNumberId = body.waPhoneNumberId;
  if (typeof body.waVerifyToken === "string" || body.waVerifyToken === null) updateData.waVerifyToken = body.waVerifyToken;
  // Only update access token if explicitly provided and not the masked placeholder
  if (typeof body.waAccessToken === "string" && body.waAccessToken !== "••••••••") {
    updateData.waAccessToken = body.waAccessToken || null;
  }

  // AI config
  if (typeof body.aiProvider === "string" || body.aiProvider === null) updateData.aiProvider = body.aiProvider;
  if (typeof body.aiModel === "string" || body.aiModel === null) updateData.aiModel = body.aiModel;
  if (typeof body.aiName === "string") updateData.aiName = body.aiName;
  if (typeof body.aiSystemPrompt === "string" || body.aiSystemPrompt === null) updateData.aiSystemPrompt = body.aiSystemPrompt;
  if (typeof body.aiApiKey === "string" && body.aiApiKey !== "••••••••") {
    updateData.aiApiKey = body.aiApiKey || null;
  }

  const updated = await prisma.clinic.update({
    where: { id: clinicId },
    data: updateData,
  });

  return NextResponse.json({ success: true, id: updated.id });
}
