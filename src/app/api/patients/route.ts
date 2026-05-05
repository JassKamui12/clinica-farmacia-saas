import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

const createPatientSchema = z.object({
  name: z.string().min(2, "Nombre requerido (min 2 caracteres)"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  whatsappPhone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const where = search
    ? { OR: [{ name: { contains: search } }, { email: { contains: search } }, { phone: { contains: search } }] }
    : {};

  const patients = await prisma.patient.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(patients);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createPatientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        name: validation.data.name,
        phone: validation.data.phone,
        email: validation.data.email,
        whatsappPhone: validation.data.whatsappPhone,
        dateOfBirth: validation.data.dateOfBirth ? new Date(validation.data.dateOfBirth) : null,
        gender: validation.data.gender,
        notes: validation.data.notes,
      },
    });
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
