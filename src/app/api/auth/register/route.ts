import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, buildSetCookieHeader } from "@/lib/auth";

const VALID_RUBROS = [
  "clinica-general", "odontologia", "farmacia", "pediatria",
  "psicologia", "fisioterapia", "nutricion", "laboratorio",
  "veterinaria", "optometria",
];

const registerSchema = z.object({
  // Clínica
  clinicName: z.string().min(2, "Nombre de clínica requerido"),
  rubroId: z.string().refine((v) => VALID_RUBROS.includes(v), "Rubro inválido"),
  city: z.string().optional(),
  // Admin user
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  name: z.string().min(2, "Nombre requerido"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { clinicName, rubroId, city, email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const slug = clinicName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20);

    // Garantizar slug único
    let finalSlug = slug;
    const slugExists = await prisma.clinic.findUnique({ where: { slug } });
    if (slugExists) {
      finalSlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 días de trial

    const passwordHash = await hash(password, 12);

    const [clinic, user] = await prisma.$transaction(async (tx) => {
      const c = await tx.clinic.create({
        data: {
          name: clinicName,
          rubroId,
          slug: finalSlug,
          city: city ?? null,
          plan: "trial",
          trialEndsAt,
        },
      });

      const u = await tx.user.create({
        data: {
          clinicId: c.id,
          email,
          passwordHash,
          name,
          role: "ADMIN",
        },
      });

      return [c, u];
    });

    const token = await signToken({
      userId: user.id,
      clinicId: clinic.id,
      role: "ADMIN",
      isSuperAdmin: false,
      tokenVersion: 0,
    });

    const res = NextResponse.json({ ok: true, redirectTo: "/dashboard/inicio" }, { status: 201 });
    res.headers.append("Set-Cookie", buildSetCookieHeader(token));
    return res;
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
