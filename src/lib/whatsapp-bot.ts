import { prisma } from "./prisma";
import { sendChannelMessage } from "./whatsapp-channel";

export interface IncomingMessage {
  phone: string;
  body: string;
  clinicId?: string;
  contactName?: string;
}

export async function sendManualMessage(
  clinicId: string,
  patientPhone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const result = await sendChannelMessage(clinicId, patientPhone, message);
  if (!result.success) return { success: false, error: result.error };

  await prisma.whatsAppMessage.create({
    data: {
      clinicId,
      phone: patientPhone,
      role: "owner",
      content: message,
    },
  });

  return { success: true };
}

export async function resumeBot(patientPhone: string): Promise<void> {
  // Será implementado en bot-service — stub para compatibilidad
  console.log(`[Bot] Resume requested for ${patientPhone}`);
}

// Stub — el procesamiento real ocurre en el bot-service (Railway)
export async function processBotMessage(msg: IncomingMessage): Promise<void> {
  console.log(`[Bot] Message from ${msg.phone} → delegating to bot-service`);
}
