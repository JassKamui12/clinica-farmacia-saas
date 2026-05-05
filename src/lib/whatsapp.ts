import { prisma } from "@/lib/prisma";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

function getConfig() {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  };
}

export interface WhatsAppTextMessage {
  phone: string;
  body: string;
  patientId?: string;
}

export interface WhatsAppTemplateMessage {
  phone: string;
  templateName: string;
  language: string;
  components?: Array<{
    type: string;
    parameters: Array<{
      type: string;
      text?: string;
      currency?: { fallback_value: string };
      date_time?: { fallback_value: string };
    }>;
  }>;
  patientId?: string;
}

export interface WhatsAppInteractiveMessage {
  phone: string;
  header?: { type: string; text: string };
  body: string;
  footer?: string;
  action: {
    button?: string;
    sections?: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
    buttons?: Array<{
      type: string;
      reply: { id: string; title: string };
    }>;
  };
  patientId?: string;
}

interface SaveMessageData {
  phone: string;
  direction: "INBOUND" | "OUTBOUND";
  body?: string;
  messageType: "TEXT" | "TEMPLATE" | "INTERACTIVE" | "MEDIA";
  templateName?: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  externalId?: string;
  error?: string;
  intent?: string;
  sessionData?: string;
  patientId?: string;
}

async function saveMessage(data: SaveMessageData) {
  return prisma.whatsAppMessage.create({
    data: {
      phone: data.phone,
      direction: data.direction,
      body: data.body || null,
      messageType: data.messageType,
      templateName: data.templateName || null,
      status: data.status,
      externalId: data.externalId || null,
      error: data.error || null,
      intent: data.intent || null,
      sessionData: data.sessionData || null,
      patientId: data.patientId || null,
    },
  });
}

export async function sendTextMessage({ phone, body, patientId }: WhatsAppTextMessage) {
  const config = getConfig();
  if (!config.phoneNumberId || !config.accessToken) {
    await saveMessage({
      phone, direction: "OUTBOUND", body, messageType: "TEXT",
      status: "FAILED", error: "WhatsApp no configurado", patientId,
    });
    return { success: false, error: "WhatsApp no configurado" };
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { body },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      await saveMessage({
        phone, direction: "OUTBOUND", body, messageType: "TEXT",
        status: "FAILED", error: data.error?.message ?? String(data.error), patientId,
      });
      return { success: false, error: data.error?.message ?? String(data.error) };
    }

    const messageId = Array.isArray(data.messages) ? data.messages[0]?.id ?? null : null;

    await saveMessage({
      phone, direction: "OUTBOUND", body, messageType: "TEXT",
      status: "SENT", externalId: messageId, patientId,
    });

    return { success: true, messageId };
  } catch (error) {
    await saveMessage({
      phone, direction: "OUTBOUND", body, messageType: "TEXT",
      status: "FAILED", error: String(error), patientId,
    });
    return { success: false, error: String(error) };
  }
}

export async function sendTemplateMessage({ phone, templateName, language = "es", components, patientId }: WhatsAppTemplateMessage) {
  const config = getConfig();
  if (!config.phoneNumberId || !config.accessToken) {
    await saveMessage({
      phone, direction: "OUTBOUND", messageType: "TEMPLATE", templateName,
      status: "FAILED", error: "WhatsApp no configurado", patientId,
    });
    return { success: false, error: "WhatsApp no configurado" };
  }

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
    },
  };

  if (components) {
    (body.template as Record<string, unknown>).components = components;
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (data.error) {
      await saveMessage({
        phone, direction: "OUTBOUND", messageType: "TEMPLATE", templateName,
        status: "FAILED", error: data.error?.message ?? String(data.error), patientId,
      });
      return { success: false, error: data.error?.message ?? String(data.error) };
    }

    const messageId = Array.isArray(data.messages) ? data.messages[0]?.id ?? null : null;

    await saveMessage({
      phone, direction: "OUTBOUND", messageType: "TEMPLATE", templateName,
      status: "SENT", externalId: messageId, patientId,
    });

    return { success: true, messageId };
  } catch (error) {
    await saveMessage({
      phone, direction: "OUTBOUND", messageType: "TEMPLATE", templateName,
      status: "FAILED", error: String(error), patientId,
    });
    return { success: false, error: String(error) };
  }
}

export async function sendInteractiveMessage({ phone, header, body: bodyText, footer, action, patientId }: WhatsAppInteractiveMessage) {
  const config = getConfig();
  if (!config.phoneNumberId || !config.accessToken) {
    await saveMessage({
      phone, direction: "OUTBOUND", body: bodyText, messageType: "INTERACTIVE",
      status: "FAILED", error: "WhatsApp no configurado", patientId,
    });
    return { success: false, error: "WhatsApp no configurado" };
  }

  const interactive: Record<string, unknown> = {
    type: action.sections ? "list" : "button",
    body: { text: bodyText },
  };

  if (header) {
    interactive.header = { type: header.type, text: header.text };
  }
  if (footer) {
    interactive.footer = { text: footer };
  }
  if (action.sections) {
    interactive.action = {
      button: action.button || "Opciones",
      sections: action.sections,
    };
  }
  if (action.buttons) {
    interactive.action = { buttons: action.buttons };
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "interactive",
          interactive,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      await saveMessage({
        phone, direction: "OUTBOUND", body: bodyText, messageType: "INTERACTIVE",
        status: "FAILED", error: data.error?.message ?? String(data.error), patientId,
      });
      return { success: false, error: data.error?.message ?? String(data.error) };
    }

    const messageId = Array.isArray(data.messages) ? data.messages[0]?.id ?? null : null;

    await saveMessage({
      phone, direction: "OUTBOUND", body: bodyText, messageType: "INTERACTIVE",
      status: "SENT", externalId: messageId, patientId,
    });

    return { success: true, messageId };
  } catch (error) {
    await saveMessage({
      phone, direction: "OUTBOUND", body: bodyText, messageType: "INTERACTIVE",
      status: "FAILED", error: String(error), patientId,
    });
    return { success: false, error: String(error) };
  }
}

export async function processWebhookStatus(statuses: Array<{
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}>) {
  for (const status of statuses) {
    const messageStatus = mapMessageStatus(status.status);
    if (messageStatus) {
      await prisma.whatsAppMessage.updateMany({
        where: { externalId: status.id },
        data: { status: messageStatus },
      });
    }
  }
}

function mapMessageStatus(status: string): "SENT" | "DELIVERED" | "READ" | "FAILED" | null {
  switch (status) {
    case "sent": return "SENT";
    case "delivered": return "DELIVERED";
    case "read": return "READ";
    case "failed": return "FAILED";
    default: return null;
  }
}

export async function getMessagesByPhone(phone: string, limit = 50) {
  return prisma.whatsAppMessage.findMany({
    where: { phone },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
