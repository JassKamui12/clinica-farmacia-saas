import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendManualMessage } from "@/lib/whatsapp-bot";

/**
 * POST /api/whatsapp/send-manual
 * El staff de la clínica envía un mensaje manual al paciente.
 * Activa el modo human takeover (bot se pausa 5 min).
 * Body: { patientPhone: string; message: string; clinicId: string }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { patientPhone, message, clinicId } = await req.json() as {
    patientPhone?: string;
    message?: string;
    clinicId?: string;
  };

  if (!patientPhone?.trim() || !message?.trim() || !clinicId?.trim()) {
    return NextResponse.json({ error: "patientPhone, message y clinicId son requeridos." }, { status: 400 });
  }

  const result = await sendManualMessage(clinicId.trim(), patientPhone.trim(), message.trim());

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Error al enviar." }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
