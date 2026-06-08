import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendTextMessage } from "@/lib/whatsapp";
import { z } from "zod";

const sendSchema = z.object({
  phone: z.string().min(1, "Teléfono requerido"),
  body: z.string().min(1, "Mensaje requerido"),
  patientId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.issues }, { status: 400 });
    }

    const { phone, body: messageBody, patientId } = parsed.data;
    const result = await sendTextMessage({ phone, body: messageBody, patientId });
    return NextResponse.json(result, result.success ? { status: 200 } : { status: 500 });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
