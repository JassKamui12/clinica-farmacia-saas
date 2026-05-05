import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  category: z.string().optional().nullable(),
  indications: z.string().optional().nullable(),
  contraindications: z.string().optional().nullable(),
  price: z.number().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const lowStock = searchParams.get("lowStock");
  const outOfStock = searchParams.get("outOfStock");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (lowStock === "true") { where.stock = { gt: 0, lt: 15 }; }
  if (outOfStock === "true") { where.stock = 0; }

  const products = await prisma.pharmacyProduct.findMany({
    where,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const product = await prisma.pharmacyProduct.create({
      data: validation.data,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const product = await prisma.pharmacyProduct.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
