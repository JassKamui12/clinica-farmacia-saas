import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resumeBot } from "@/lib/whatsapp-bot";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const { patientPhone } = await req.json() as { patientPhone?: string };
    if (!patientPhone?.trim()) {
      return NextResponse.json({ error: "patientPhone es requerido" }, { status: 400 });
    }
    await resumeBot(patientPhone.trim());
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
