import { NextRequest, NextResponse } from "next/server";
import { processWebhookStatus } from "@/lib/whatsapp";
import { processBotMessage } from "@/lib/whatsapp-bot";
import { prisma } from "@/lib/prisma";

// ── Verificación del webhook (GET de Meta) ───────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verificar contra el token global o contra cualquier clínica configurada
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  // Fallback: buscar entre tokens de clínicas individuales
  const clinic = await prisma.clinic.findFirst({
    where: { waVerifyToken: token ?? undefined },
    select: { id: true },
  });
  if (mode === "subscribe" && clinic) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ── Mensajes entrantes (POST de Meta) ────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.object !== "whatsapp_business_account") {
    return new NextResponse("OK", { status: 200 });
  }

  for (const entry of (body.entry ?? [])) {
    for (const change of (entry.changes ?? [])) {
      const value = change.value ?? {};

      // Actualizar estado de mensajes enviados
      if (value.statuses) {
        await processWebhookStatus(value.statuses);
      }

      if (!value.messages) continue;

      // Identificar la clínica por phone_number_id del número que recibió el mensaje
      const phoneNumberId: string | undefined = value.metadata?.phone_number_id;
      const clinicId = phoneNumberId
        ? await resolveClinicByPhoneId(phoneNumberId)
        : null;

      const contacts = value.contacts as Array<{ profile?: { name?: string }; wa_id?: string }> | undefined;

      for (const message of (value.messages as Record<string, unknown>[])) {
        const phone             = message.from as string | undefined;
        const messageBody       = (message.text as Record<string, string> | undefined)?.body ?? "";
        const interactiveReply  =
          (message.interactive as Record<string, Record<string, string>> | undefined)?.button_reply?.title ??
          (message.interactive as Record<string, Record<string, string>> | undefined)?.list_reply?.title ??
          "";

        const fullBody = interactiveReply || messageBody;
        if (!phone || !fullBody) continue;

        const contactName = contacts?.find((c) => c.wa_id === phone)?.profile?.name;

        try {
          await processBotMessage({
            phone,
            body: fullBody,
            whatsappMessageId: message.id as string,
            rawMessage: message,
            clinicId: clinicId ?? undefined,
            contactName,
          });
        } catch (err) {
          console.error(`[Webhook] Error procesando mensaje de ${phone}:`, err);
        }
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}

// ── Helper: resolver clínica por phoneNumberId ───────────────────────────────

async function resolveClinicByPhoneId(phoneNumberId: string): Promise<string | null> {
  const clinic = await prisma.clinic.findFirst({
    where: { waPhoneNumberId: phoneNumberId, isActive: true },
    select: { id: true },
  });
  return clinic?.id ?? null;
}
