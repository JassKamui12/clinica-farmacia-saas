import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, buildSetCookieHeader } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        clinicId: true,
        role: true,
        isSuperAdmin: true,
        tokenVersion: true,
        passwordHash: true,
        isActive: true,
        name: true,
      },
    });

    if (!user || !user.passwordHash || !user.isActive) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      clinicId: user.clinicId,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      tokenVersion: user.tokenVersion,
    });

    const redirectTo = user.isSuperAdmin ? "/super-admin/panel" : "/dashboard/inicio";

    const res = NextResponse.json({ ok: true, redirectTo });
    res.headers.append("Set-Cookie", buildSetCookieHeader(token));
    return res;
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
