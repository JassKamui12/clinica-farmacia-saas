import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendTextMessage, sendTemplateMessage } from "@/lib/whatsapp";
import { z } from "zod";

const sendSchema = z.object({
  phone: z.string().min(1, "Teléfono requerido"),
  body: z.string().min(1, "Mensaje requerido"),
  templateName: z.string().optional(),
  patientId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const validation = sendSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { phone, body: messageBody, templateName, patientId } = validation.data;

  if (templateName) {
    const result = await sendTemplateMessage({
      phone,
      templateName,
      language: "es",
      patientId,
    });
    return NextResponse.json(result, result.success ? { status: 200 } : { status: 500 });
  }

  const result = await sendTextMessage({ phone, body: messageBody, patientId });
  return NextResponse.json(result, result.success ? { status: 200 } : { status: 500 });
}
