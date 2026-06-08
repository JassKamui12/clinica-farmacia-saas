/**
 * Abstracción de canal WhatsApp: intenta Meta primero, cae a Baileys si falla o si
 * la clínica está configurada en modo BAILEYS.
 */

import { sendTextMessage as metaSend } from "./whatsapp";
import { prisma } from "./prisma";

const BOT_SERVICE_URL = process.env.BOT_SERVICE_URL ?? "http://localhost:3002";
const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET ?? "";

interface SendResult {
  success: boolean;
  error?: string;
  channel?: "meta" | "baileys";
}

async function getClinicMode(clinicId: string): Promise<string> {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { waMode: true, waPhoneNumberId: true, waAccessToken: true },
    });
    if (!clinic) return "META";
    if (clinic.waMode === "BAILEYS") return "BAILEYS";
    if (clinic.waPhoneNumberId && clinic.waAccessToken) return "META";
    return "BAILEYS"; // Si Meta no está configurado, intentar Baileys
  } catch {
    return "META";
  }
}

async function sendViaBaileys(phone: string, body: string): Promise<SendResult> {
  try {
    const res = await fetch(`${BOT_SERVICE_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": BOT_INTERNAL_SECRET,
      },
      body: JSON.stringify({ phone, message: body }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error en bot-service" }));
      return { success: false, error: err.error, channel: "baileys" };
    }

    return { success: true, channel: "baileys" };
  } catch (error) {
    return { success: false, error: String(error), channel: "baileys" };
  }
}

export async function sendChannelMessage(
  clinicId: string,
  phone: string,
  body: string,
  patientId?: string
): Promise<SendResult> {
  return sendMessage(clinicId, phone, body, patientId);
}

export async function sendMessage(
  clinicId: string,
  phone: string,
  body: string,
  patientId?: string
): Promise<SendResult> {
  const mode = await getClinicMode(clinicId);

  if (mode === "BAILEYS") {
    return sendViaBaileys(phone, body);
  }

  // Meta primero
  const metaResult = await metaSend({ phone, body, patientId });
  if (metaResult.success) return { success: true, channel: "meta" };

  // Fallback a Baileys si Meta falla
  console.warn(`[WhatsApp Channel] Meta falló (${metaResult.error}), intentando Baileys...`);
  return sendViaBaileys(phone, body);
}

export async function getBaileysStatus(): Promise<{ connected: boolean; qr?: string; phone?: string }> {
  try {
    const res = await fetch(`${BOT_SERVICE_URL}/status`, {
      headers: { "X-Internal-Secret": BOT_INTERNAL_SECRET },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return { connected: false };
    return await res.json();
  } catch {
    return { connected: false };
  }
}

export async function getBaileysQR(): Promise<{ qr?: string } | null> {
  try {
    const res = await fetch(`${BOT_SERVICE_URL}/qr`, {
      headers: { "X-Internal-Secret": BOT_INTERNAL_SECRET },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
