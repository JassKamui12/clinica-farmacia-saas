import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  role: z.enum(["ADMIN", "DOCTOR", "PHARMACIST"]).default("DOCTOR"),
  whatsappPhone: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Register request body:", { ...body, password: "***" });

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      console.log("Validation error:", validation.error.issues);
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, password, name, role, whatsappPhone } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    console.log("Password hashed successfully");

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        whatsappPhone: whatsappPhone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        whatsappPhone: true,
        createdAt: true,
      },
    });

    console.log("User created:", user.id);
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Register error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
