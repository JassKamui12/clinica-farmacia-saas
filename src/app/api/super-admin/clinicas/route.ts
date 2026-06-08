import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const rubroId = searchParams.get("rubroId") ?? "";
    const plan = searchParams.get("plan") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = 20;

    const where: Record<string, unknown> = {};
    if (q) where.name = { contains: q, mode: "insensitive" };
    if (rubroId) where.rubroId = rubroId;
    if (plan) where.plan = plan;

    const [clinicas, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        select: {
          id: true, name: true, rubroId: true, plan: true,
          isActive: true, trialEndsAt: true, slug: true,
          createdAt: true,
          _count: { select: { patients: true, appointments: true, users: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.clinic.count({ where }),
    ]);

    return NextResponse.json({ clinicas, total, page, pages: Math.ceil(total / limit) });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
