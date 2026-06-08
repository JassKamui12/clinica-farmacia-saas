import { NextRequest, NextResponse } from "next/server";
import { requireAuth, botSession } from "@/lib/auth";
import { isBotRequest } from "@/lib/botAuth";
import { prisma } from "@/lib/prisma";

async function resolveSession(req: NextRequest, clinicIdOverride?: string) {
  if (isBotRequest(req) && clinicIdOverride) return botSession(clinicIdOverride);
  return requireAuth();
}
import { z } from "zod";
import { hash } from "bcrypt";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  whatsappPhone: z.string().optional(),
  role: z.enum(["DOCTOR", "RECEPTIONIST", "PHARMACIST"]).default("DOCTOR"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicIdParam = searchParams.get("clinicId") ?? undefined;
    const session = await resolveSession(req, clinicIdParam);
    const role = searchParams.get("role");

    const where: Record<string, unknown> = {
      clinicId: session.clinicId,
      isSuperAdmin: false,
    };
    if (role) where.role = role;

    const doctores = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        specialty: true, licenseNumber: true, whatsappPhone: true,
        isActive: true, createdAt: true,
        _count: { select: { appointments: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(doctores);
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo el administrador puede crear usuarios" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 400 });
    }

    const { name, email, password, specialty, licenseNumber, whatsappPhone, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const usuario = await prisma.user.create({
      data: {
        clinicId: session.clinicId!,
        email,
        passwordHash,
        name,
        role,
        specialty: specialty || null,
        licenseNumber: licenseNumber || null,
        whatsappPhone: whatsappPhone || null,
      },
      select: { id: true, name: true, email: true, role: true, specialty: true, createdAt: true },
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
