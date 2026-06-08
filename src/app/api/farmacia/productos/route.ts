import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0).default(5),
  unit: z.string().default("unidad"),
  requiresPrescription: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const category = searchParams.get("category") ?? "";
    const lowStock = searchParams.get("lowStock") === "1";

    const where: Record<string, unknown> = { clinicId: session.clinicId };
    if (q) where.name = { contains: q, mode: "insensitive" };
    if (category) where.category = category;
    if (lowStock) {
      where.OR = [
        { stock: { equals: 0 } },
        // stock <= minStock — Prisma no soporta campo-a-campo comparación, así que filtramos después
      ];
    }

    const productos = await prisma.pharmacyProduct.findMany({
      where,
      orderBy: { name: "asc" },
    });

    const result = lowStock
      ? productos.filter((p) => p.stock <= p.minStock)
      : productos;

    return NextResponse.json(result);
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 400 });
    }

    const producto = await prisma.pharmacyProduct.create({
      data: { clinicId: session.clinicId!, ...parsed.data },
    });

    return NextResponse.json(producto, { status: 201 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
