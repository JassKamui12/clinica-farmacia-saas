import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendManualMessage } from "@/lib/whatsapp-bot";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { patientPhone, message, clinicId } = await req.json() as {
      patientPhone?: string;
      message?: string;
      clinicId?: string;
    };

    if (!patientPhone?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "patientPhone y message son requeridos" }, { status: 400 });
    }

    const resolvedClinicId = clinicId?.trim() ?? session.clinicId ?? "";
    const result = await sendManualMessage(resolvedClinicId, patientPhone.trim(), message.trim());

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Error al enviar" }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
