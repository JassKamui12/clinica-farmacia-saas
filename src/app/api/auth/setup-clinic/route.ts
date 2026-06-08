import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, signToken, buildSetCookieHeader } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_RUBROS = [
  "clinica-general","odontologia","farmacia","pediatria",
  "psicologia","fisioterapia","nutricion","laboratorio","veterinaria","optometria",
];

const schema = z.object({
  clinicName: z.string().min(2),
  rubroId: z.string().refine((v) => VALID_RUBROS.includes(v)),
  city: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    // Solo usuarios sin clínica asignada pueden usar este endpoint
    if (session.clinicId) {
      return NextResponse.json({ error: "Ya tienes una clínica configurada" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 400 });
    }

    const { clinicName, rubroId, city } = parsed.data;

    // Generar slug único
    const base = clinicName
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20);

    const exists = await prisma.clinic.findUnique({ where: { slug: base } });
    const slug = exists ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const [clinic] = await prisma.$transaction(async (tx) => {
      const c = await tx.clinic.create({
        data: { name: clinicName, rubroId, slug, city: city ?? null, plan: "trial", trialEndsAt },
      });
      await tx.user.update({
        where: { id: session.userId },
        data: { clinicId: c.id },
      });
      return [c];
    });

    // Re-emitir JWT con el clinicId nuevo
    const newToken = await signToken({
      userId: session.userId,
      clinicId: clinic.id,
      role: session.role,
      isSuperAdmin: session.isSuperAdmin,
      tokenVersion: session.tokenVersion,
    });

    const res = NextResponse.json({ ok: true, redirectTo: "/dashboard/inicio" });
    res.headers.append("Set-Cookie", buildSetCookieHeader(newToken));
    return res;
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
