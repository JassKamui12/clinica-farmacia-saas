import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resumeBot } from "@/lib/whatsapp-bot";

/**
 * POST /api/whatsapp/resume
 * Reactiva el bot manualmente para un número de paciente.
 * Body: { patientPhone: string }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { patientPhone } = await req.json() as { patientPhone?: string };
  if (!patientPhone?.trim()) {
    return NextResponse.json({ error: "patientPhone es requerido." }, { status: 400 });
  }

  await resumeBot(patientPhone.trim());
  return NextResponse.json({ success: true });
}
