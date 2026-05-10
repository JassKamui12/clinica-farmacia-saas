import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

const updatePatientSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  whatsappPhone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
        id: crypto.randomUUID(),
        name: validation.data.name,
        phone: validation.data.phone,
        email: validation.data.email,
        whatsappPhone: validation.data.whatsappPhone,
        dateOfBirth: validation.data.dateOfBirth ? new Date(validation.data.dateOfBirth) : null,
        gender: validation.data.gender,
        notes: validation.data.notes,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const validation = updatePatientSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data: any = { ...validation.data, updatedAt: new Date() };
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }

    const patient = await prisma.patient.update({
      where: { id },
      data,
    });
    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await prisma.patient.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
