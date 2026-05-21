/**
 * Punto de entrada del bot de WhatsApp para la clínica SaaS.
 *
 * Delega todo el procesamiento al motor conversacional (clinic-ai-handler).
 * Mantiene las funciones de human takeover para que el staff pueda
 * tomar el control de una conversación desde el dashboard.
 */

import { prisma } from "./prisma";
import { sendTextMessage } from "./whatsapp";
import { processClinicMessage } from "./clinic-ai-handler";

export interface IncomingMessage {
  phone: string;
  body: string;
  whatsappMessageId: string;
  rawMessage: Record<string, unknown>;
  clinicId?: string;
  contactName?: string;
}

// ── Procesamiento principal ──────────────────────────────────────────────────

export async function processBotMessage(msg: IncomingMessage) {
  // Si no se resolvió la clínica en el webhook, intentar por número master global
  const clinicId = msg.clinicId ?? await resolveClinicFallback();

  if (!clinicId) {
    console.warn(`[Bot] No se pudo identificar la clínica para ${msg.phone}`);
    return;
  }

  const result = await processClinicMessage(
    clinicId,
    msg.phone,
    msg.body,
    msg.contactName
  );

  if (result.paused) {
    // Bot en modo manual — no responder
    return;
  }

  if (result.reply) {
    await sendTextMessage({ phone: msg.phone, body: result.reply });
  }
}

// ── Human takeover: staff toma control ──────────────────────────────────────

/**
 * El staff envía un mensaje manual al paciente.
 * Marca la sesión como ownerTakenOver — el bot no responderá por 5 minutos.
 */
export async function sendManualMessage(
  clinicId: string,
  patientPhone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const result = await sendTextMessage({ phone: patientPhone, body: message });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Guardar mensaje como OUTBOUND con intent "manual"
  await prisma.whatsAppMessage.create({
    data: {
      clinicId,
      phone: patientPhone,
      direction: "OUTBOUND",
      body: message,
      messageType: "TEXT",
      status: "SENT",
      intent: "manual",
    },
  });

  // Activar human takeover — reinicia el reloj de 5 min en cada mensaje del staff
  await prisma.whatsAppSession.upsert({
    where: { phone: patientPhone },
    create: {
      phone: patientPhone,
      clinicId,
      ownerTakenOver: true,
      ownerLastMessageAt: new Date(),
      contextData: "{}",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    update: {
      ownerTakenOver: true,
      ownerLastMessageAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * El staff reactiva el bot manualmente antes de que pasen 5 minutos.
 */
export async function resumeBot(patientPhone: string): Promise<void> {
  await prisma.whatsAppSession.updateMany({
    where: { phone: patientPhone },
    data: { ownerTakenOver: false, ownerLastMessageAt: null },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function resolveClinicFallback(): Promise<string | null> {
  // Si solo hay una clínica activa en la BD, usarla como fallback
  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    select: { id: true },
    take: 2,
  });
  return clinics.length === 1 ? clinics[0].id : null;
}
