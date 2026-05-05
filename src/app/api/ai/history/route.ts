import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const recommendations = await prisma.aiRecommendation.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json(recommendations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
