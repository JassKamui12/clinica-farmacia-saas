import { prisma } from "@/lib/prisma";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

function getConfig() {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  };
}

export interface WhatsAppTextMessage {
  phone: string;
  body: string;
  clinicId?: string;
  patientId?: string;
}

export async function sendTextMessage(
  params: WhatsAppTextMessage
): Promise<{ success: boolean; error?: string }> {
  const { phoneNumberId, accessToken } = getConfig();
  const { phone, body, clinicId, patientId } = params;

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WhatsApp no configurado" };
  }

  try {
    const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: JSON.stringify(err) };
    }

    if (clinicId) {
      await prisma.whatsAppMessage.create({
        data: { clinicId, phone, role: "assistant", content: body, patientId: patientId ?? null },
      });
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getMessagesByPhone(phone: string, limit = 50) {
  return prisma.whatsAppMessage.findMany({
    where: { phone },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}
