import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  indications: z.string().optional().nullable(),
  contraindications: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  requiresPrescription: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 400 });
    }

    // Verifica que el producto pertenece a la clínica de la sesión.
    const existing = await prisma.pharmacyProduct.findFirst({
      where: { id, clinicId: session.clinicId! },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const producto = await prisma.pharmacyProduct.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(producto);
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const existing = await prisma.pharmacyProduct.findFirst({
      where: { id, clinicId: session.clinicId! },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    await prisma.pharmacyProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
