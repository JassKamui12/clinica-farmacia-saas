import { prisma } from "@/lib/prisma";
import { sendTextMessage, sendInteractiveMessage } from "@/lib/whatsapp";
import { chat, ChatMessage } from "@/lib/claude";
import { BOT_MENU } from "@/lib/whatsapp-templates";

export interface IncomingMessage {
  phone: string;
  body: string;
  whatsappMessageId: string;
  rawMessage: Record<string, unknown>;
}

interface BotSession {
  id: string;
  phone: string;
  currentIntent: string | null;
  step: string;
  contextData: Record<string, string>;
  expiresAt: Date;
}

export async function processBotMessage(msg: IncomingMessage) {
  await saveInboundMessage(msg);

  const session = await getOrCreateSession(msg.phone);
  const lowerBody = msg.body.toLowerCase().trim();

  if (lowerBody === "1" || lowerBody === "menu" || lowerBody === "inicio") {
    await resetSession(session);
    await sendTextMessage({ phone: msg.phone, body: BOT_MENU });
    return;
  }

  if (lowerBody.includes("cancelar") || lowerBody.includes("salir")) {
    await resetSession(session);
    await sendTextMessage({
      phone: msg.phone,
      body: "✅ Sesión cancelada. Escribe 1 para ver el menú principal.",
    });
    return;
  }

  if (session.step === "menu" || !session.currentIntent) {
    await handleMenuSelection(msg.phone, session, msg.body);
    return;
  }

  await handleIntentFlow(msg.phone, session, msg.body);
}

async function handleMenuSelection(phone: string, session: BotSession, input: string) {
  const trimmed = input.trim();

  if (trimmed === "1") {
    await updateSession(session.id, {
      currentIntent: "agendar_cita",
      step: "ask_date",
      contextData: {},
    });
    await sendTextMessage({
      phone,
      body: "📅 *Agendar Cita*\n\n¿Qué fecha prefieres? (Ej: lunes 5 de mayo, o 05/05/2025)",
    });
  } else if (trimmed === "2") {
    await updateSession(session.id, {
      currentIntent: "consultar_cita",
      step: "processing",
      contextData: {},
    });
    await handleConsultarCita(phone);
  } else if (trimmed === "3") {
    await updateSession(session.id, {
      currentIntent: "triage",
      step: "ask_symptoms",
      contextData: {},
    });
    await sendTextMessage({
      phone,
      body: "🏥 *Evaluación de Síntomas*\n\nDescribe tus síntomas con el mayor detalle posible. Un asistente de IA evaluará la urgencia de tu caso.\n\nEjemplo: 'Tengo dolor de cabeza fuerte desde ayer y fiebre de 38.5'",
    });
  } else if (trimmed === "4") {
    await updateSession(session.id, {
      currentIntent: "seguimiento",
      step: "processing",
      contextData: {},
    });
    await handleSeguimiento(phone);
  } else if (trimmed === "5") {
    await updateSession(session.id, {
      currentIntent: "consultar_receta",
      step: "processing",
      contextData: {},
    });
    await handleConsultarReceta(phone);
  } else if (trimmed === "6") {
    await sendTextMessage({
      phone,
      body: "📞 Tu solicitud ha sido enviada. Un miembro de nuestro equipo te contactará pronto.\n\nMientras tanto, ¿hay algo más en lo que pueda ayudarte?",
    });
    await prisma.notification.create({
      data: {
        title: "Solicitud de contacto humano",
        content: `Paciente con teléfono ${phone} solicita hablar con un humano.`,
        channel: "in_app",
        role: "ADMIN",
      },
    });
    await resetSession(session);
  } else {
    await sendTextMessage({
      phone,
      body: "No entendí tu selección. Por favor responde con un número del 1 al 6:\n\n" + BOT_MENU,
    });
  }
}

async function handleIntentFlow(phone: string, session: BotSession, input: string) {
  const patient = await prisma.patient.findFirst({
    where: { whatsappPhone: phone },
  });

  switch (session.currentIntent) {
    case "agendar_cita":
      await handleAgendarCita(phone, session, input, patient?.id);
      break;
    case "consultar_cita":
      await handleConsultarCita(phone);
      await resetSession(session);
      break;
    case "triage":
      await handleTriageFlow(phone, session, input, patient?.id);
      break;
    case "seguimiento":
      await handleSeguimientoFlow(phone, session, input, patient?.id);
      break;
    case "consultar_receta":
      await handleConsultarReceta(phone);
      await resetSession(session);
      break;
    default:
      await handleUnknownIntent(phone, input);
  }
}

async function handleAgendarCita(phone: string, session: BotSession, input: string, patientId?: string) {
  switch (session.step) {
    case "ask_date": {
      await updateSession(session.id, {
        step: "ask_time",
        contextData: { ...session.contextData, preferredDate: input },
      });
      await sendTextMessage({
        phone,
        body: "⏰ ¿A qué hora te gustaría?\n\nHorarios disponibles: 8:00 - 17:00\n(Ej: 9:00, 14:30)",
      });
      break;
    }

    case "ask_time": {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(input.trim())) {
        await sendTextMessage({
          phone,
          body: "⚠️ Formato de hora inválido. Usa el formato HH:MM (Ej: 9:00, 14:30)",
        });
        return;
      }

      await updateSession(session.id, {
        step: "confirm",
        contextData: { ...session.contextData, preferredTime: input.trim() },
      });

      const context: Record<string, string> = { ...session.contextData, preferredTime: input.trim() };
      const preferredDate = context["preferredDate"] || "";
      const preferredTime = context.preferredTime;

      const result = await findDoctorForAppointment(preferredDate, preferredTime);

      if (result.doctorId) {
        await updateSession(session.id, {
          contextData: { ...session.contextData, ...result.context },
        });

        await sendTextMessage({
          phone,
          body: `✅ Tu cita está programada:\n\n📅 Fecha: ${result.date}\n⏰ Hora: ${preferredTime}\n👨‍⚕️ Doctor: ${result.doctorName}\n\nResponde "confirmo" para confirmar o "cancelar" para buscar otra opción.`,
        });
      } else {
        await sendTextMessage({
          phone,
          body: `Lo siento, no hay horarios disponibles en esa fecha. ¿Quieres intentar con otra fecha y hora? Escribe la nueva fecha.`,
        });
        await updateSession(session.id, {
          step: "ask_date",
        });
      }
      break;
    }

    case "confirm": {
      if (input.toLowerCase().includes("confirmo") || input.toLowerCase().includes("sí") || input.toLowerCase().includes("si")) {
        const context = session.contextData;
        if (context.doctorId && context.date) {
          await prisma.appointment.create({
            data: {
              patientId: patientId || "",
              doctorId: context.doctorId,
              date: new Date(context.date),
              time: context.preferredTime || "09:00",
              status: "CONFIRMED",
              reason: "Agendada por WhatsApp",
              whatsappConfirmed: true,
            },
          });

          await sendTextMessage({
            phone,
            body: `🎉 ¡Cita confirmada!\n\nTe enviaremos un recordatorio 24 horas antes.\n\n¿Necesitas algo más? Escribe 1 para ver el menú.`,
          });
        }
        await resetSession(session);
      } else {
        await sendTextMessage({
          phone,
          body: "Entendido. ¿Quieres intentar con otra fecha? Escribe la nueva fecha.",
        });
        await updateSession(session.id, { step: "ask_date", contextData: {} });
      }
      break;
    }

    default:
      await resetSession(session);
      await sendTextMessage({ phone, body: BOT_MENU });
  }
}

async function handleConsultarCita(phone: string) {
  const patient = await prisma.patient.findFirst({
    where: { whatsappPhone: phone },
  });

  if (!patient) {
    await sendTextMessage({
      phone,
      body: "No encontré tu número registrado. Para agendar una cita, contacta a nuestra clínica.",
    });
    return;
  }

  const nextAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      date: { gte: new Date() },
    },
    include: {
      User: { select: { name: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  if (nextAppointment) {
    const dateStr = nextAppointment.date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    await sendTextMessage({
      phone,
      body: `📅 Tu próxima cita:\n\n📆 ${dateStr}\n⏰ ${nextAppointment.time}\n👨‍⚕️ ${nextAppointment.User?.name || "Doctor asignado"}\n📋 Estado: ${nextAppointment.status}\n\nPara cancelar o reagendar, responde "cancelar" y te ayudaré.`,
    });
  } else {
    await sendTextMessage({
      phone,
      body: "No tienes citas programadas.\n\n¿Quieres agendar una? Escribe 1 para ver el menú.",
    });
  }
}

async function handleSeguimiento(phone: string) {
  const patient = await prisma.patient.findFirst({
    where: { whatsappPhone: phone },
  });

  if (!patient) {
    await sendTextMessage({
      phone,
      body: "No encontré tu registro. Contacta a la clínica para registrarte.",
    });
    return;
  }

  const activeFollowUp = await prisma.patientFollowUp.findFirst({
    where: { patientId: patient.id, status: "ACTIVE" },
    include: { Prescription: true },
  });

  if (activeFollowUp) {
    const medication = activeFollowUp.Prescription?.productName || "tu tratamiento";
    await sendTextMessage({
      phone,
      body: `📋 *Seguimiento de Tratamiento*\n\nMedicamento: ${medication}\n\n¿Cómo te sientes? Responde:\n1️⃣ Todo bien, sin problemas\n2️⃣ Molestias leves\n3️⃣ Efectos adversos\n4️⃣ No he podido tomarlo`,
    });
  } else {
    await sendTextMessage({
      phone,
      body: "No tienes un seguimiento activo en este momento.\n\n¿Necesitas algo más? Escribe 1 para ver el menú.",
    });
  }
}

async function handleSeguimientoFlow(phone: string, session: BotSession, input: string, patientId?: string) {
  if (!patientId) {
    await sendTextMessage({ phone, body: "No encontré tu registro." });
    await resetSession(session);
    return;
  }

  const followUp = await prisma.patientFollowUp.findFirst({
    where: { patientId, status: "ACTIVE" },
  });

  if (!followUp) {
    await resetSession(session);
    return;
  }

  let status: string;
  let alert = false;
  let alertReason: string | undefined;

  if (input.includes("1") || input.toLowerCase().includes("bien")) {
    status = "Todo bien";
    await prisma.patientFollowUp.update({
      where: { id: followUp.id },
      data: {
        lastCheckIn: new Date(),
        adherenceScore: Math.min(100, followUp.adherenceScore + 5),
      },
    });
    await sendTextMessage({
      phone,
      body: "¡Excelente! Me alegra saber que todo va bien. 😊\n\nContinúa con tu tratamiento. ¿Necesitas algo más?",
    });
  } else if (input.includes("2") || input.toLowerCase().includes("molestia")) {
    status = "Molestias leves";
    await prisma.patientFollowUp.update({
      where: { id: followUp.id },
      data: { lastCheckIn: new Date(), adherenceScore: Math.max(0, followUp.adherenceScore - 10) },
    });
    await sendTextMessage({
      phone,
      body: "Entiendo. Las molestias leves son normales al inicio. Si persisten más de 2 días, consulta con tu médico.\n\n¿Necesitas algo más?",
    });
  } else if (input.includes("3") || input.toLowerCase().includes("efecto") || input.toLowerCase().includes("adverso")) {
    status = "Efectos adversos";
    alert = true;
    alertReason = "Paciente reporta efectos adversos";
    await prisma.patientFollowUp.update({
      where: { id: followUp.id },
      data: {
        lastCheckIn: new Date(),
        alertTriggered: true,
        alertReason,
        status: "ALERT",
      },
    });
    await prisma.notification.create({
      data: {
        title: "⚠️ Alerta de seguimiento",
        content: `Paciente reporta efectos adversos. Revisar inmediatamente.`,
        channel: "in_app",
        role: "DOCTOR",
      },
    });
    await sendTextMessage({
      phone,
      body: "⚠️ He notificado a tu médico sobre tu situación. Te contactarán pronto.\n\nSi los síntomas son graves, acude a urgencias.",
    });
  } else if (input.includes("4") || input.toLowerCase().includes("no he podido")) {
    status = "No adherente";
    await prisma.patientFollowUp.update({
      where: { id: followUp.id },
      data: {
        lastCheckIn: new Date(),
        adherenceScore: Math.max(0, followUp.adherenceScore - 20),
        status: "NON_ADHERENT",
      },
    });
    await sendTextMessage({
      phone,
      body: "Entiendo. Es importante seguir el tratamiento para tu recuperación. ¿Hay algún problema específico que te impida tomarlo?\n\nPuedo agendarte una consulta con tu médico si lo necesitas. Escribe 1 para ver opciones.",
    });
  } else {
    await sendTextMessage({
      phone,
      body: "No entendí tu respuesta. Por favor responde con un número del 1 al 4.",
    });
    return;
  }

  await resetSession(session);
}

async function handleTriageFlow(phone: string, session: BotSession, input: string, patientId?: string) {
  if (session.step === "ask_symptoms") {
    await updateSession(session.id, {
      step: "processing",
      contextData: { ...session.contextData, symptoms: input },
    });

    await sendTextMessage({
      phone,
      body: "⏳ Analizando tus síntomas con IA...\n\nEsto tomará unos segundos.",
    });

    try {
      const triageRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: input, patientId, phone }),
      });

      const triageData = await triageRes.json();

      if (!triageRes.ok) {
        throw new Error(triageData.error || "Error en triaje");
      }

      const urgencyLabels: Record<string, string> = {
        LOW: "🟢 LEVE",
        MEDIUM: "🟡 MODERADO",
        HIGH: "🟠 URGENTE",
        EMERGENCY: "🔴 EMERGENCIA",
      };

      const urgencyLabel = urgencyLabels[triageData.urgency] || triageData.urgency;

      let responseMsg = `📋 *Resultado de Evaluación*\n\n`;
      responseMsg += `Nivel: ${urgencyLabel}\n\n`;
      responseMsg += `${triageData.summary}\n\n`;
      responseMsg += `💡 Recomendación: ${triageData.recommendation}\n\n`;

      if (triageData.redFlags && triageData.redFlags.length > 0) {
        responseMsg += `⚠️ Señales de alerta:\n${triageData.redFlags}\n\n`;
      }

      if (triageData.urgency === "EMERGENCY") {
        responseMsg += `🚨 *ACUDE A URGENCIAS INMEDIATAMENTE* o llama al 911.\n\n`;
      } else if (triageData.urgency === "HIGH") {
        responseMsg += `¿Quieres que te agende una cita para hoy? Responde SÍ o NO.\n\n`;
        await updateSession(session.id, {
          step: "emergency_offer",
          contextData: { ...session.contextData, triageReportId: triageData.reportId },
        });
        await sendTextMessage({ phone, body: responseMsg });
        return;
      }

      if (triageData.suggestedQuestions && triageData.suggestedQuestions.length > 0) {
        const questions = triageData.suggestedQuestions.split(";").slice(0, 2);
        responseMsg += `Para ayudarte mejor:\n`;
        questions.forEach((q: string, i: number) => {
          responseMsg += `${i + 1}. ${q.trim()}\n`;
        });
        responseMsg += `\nResponde con más detalles o escribe MENU para volver al inicio.`;
      } else {
        responseMsg += `¿Necesitas algo más? Escribe MENU para volver al inicio.`;
      }

      await sendTextMessage({ phone, body: responseMsg });
      await resetSession(session);
    } catch (error) {
      console.error("Triage error:", error);
      await sendTextMessage({
        phone,
        body: "Hubo un error al procesar tu evaluación. Por favor contacta directamente a la clínica.\n\nEscribe MENU para volver al inicio.",
      });
      await resetSession(session);
    }
  } else if (session.step === "emergency_offer") {
    if (input.toLowerCase().includes("sí") || input.toLowerCase().includes("si")) {
      await updateSession(session.id, {
        currentIntent: "agendar_cita",
        step: "ask_date",
        contextData: { ...session.contextData, urgentTriage: "true" },
      });
      await sendTextMessage({
        phone,
        body: "📅 Entendido, vamos a agendarte una cita prioritaria.\n\n¿Qué horario prefieres hoy o mañana? (Ej: 9:00, 14:30)",
      });
    } else {
      await sendTextMessage({
        phone,
        body: "Entendido. Si tus síntomas empeoran, no dudes en buscar atención médica.\n\nEscribe MENU para ver otras opciones.",
      });
      await resetSession(session);
    }
  } else {
    await updateSession(session.id, {
      step: "ask_symptoms",
      contextData: { ...session.contextData, additionalSymptoms: input },
    });
    await sendTextMessage({
      phone,
      body: "Gracias por la información adicional. ¿Hay algo más que deba saber? Escribe 'listo' para procesar la evaluación, o agrega más detalles.",
    });

    if (input.toLowerCase().includes("listo") || input.toLowerCase().includes("procesar")) {
      const allSymptoms = session.contextData.symptoms + ". Adicional: " + input;
      await handleTriageFlow(phone, { ...session, step: "ask_symptoms", contextData: { ...session.contextData, symptoms: allSymptoms } }, allSymptoms, undefined);
    }
  }
}

async function handleConsultarReceta(phone: string) {
  const patient = await prisma.patient.findFirst({
    where: { whatsappPhone: phone },
  });

  if (!patient) {
    await sendTextMessage({ phone, body: "No encontré tu registro." });
    return;
  }

  const lastPrescription = await prisma.prescription.findFirst({
    where: { patientId: patient.id },
    include: { User: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (lastPrescription) {
    await sendTextMessage({
      phone,
      body: `💊 *Tu última receta:*\n\nMedicamento: ${lastPrescription.productName}\nDosis: ${lastPrescription.dosage || "No especificada"}\nInstrucciones: ${lastPrescription.instructions || "No especificadas"}\nDoctor: ${lastPrescription.User?.name || "No asignado"}\n\nSi necesitas una nueva receta, consulta con tu médico.`,
    });
  } else {
    await sendTextMessage({
      phone,
      body: "No tienes recetas registradas.",
    });
  }
}

async function handleUnknownIntent(phone: string, input: string) {
  const result = await classifyIntentWithAI(input);

  if (result.intent === "agendar_cita") {
    await sendTextMessage({
      phone,
      body: "Entiendo que quieres agendar una cita. ¿Qué fecha prefieres?",
    });
  } else if (result.intent === "consultar_cita") {
    await handleConsultarCita(phone);
  } else {
    await sendTextMessage({
      phone,
      body: "No estoy seguro de entender. ¿Puedes elegir una opción?\n\n" + BOT_MENU,
    });
  }
}

async function findDoctorForAppointment(date: string, time: string) {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    select: { id: true, name: true, email: true },
  });

  if (doctors.length === 0) {
    return { doctorId: null, doctorName: null, date: "", context: {} };
  }

  const doctor = doctors[Math.floor(Math.random() * doctors.length)];

  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return { doctorId: null, doctorName: null, date: "", context: {} };
  }

  return {
    doctorId: doctor.id,
    doctorName: doctor.name || doctor.email,
    date: parsedDate.toISOString(),
    context: { doctorId: doctor.id, doctorName: doctor.name || doctor.email, date: parsedDate.toISOString() },
  };
}

function parseDate(input: string): Date | null {
  const dateMatch = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dateMatch) {
    const date = new Date(`${dateMatch[3]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`);
    if (!isNaN(date.getTime())) return date;
  }

  const today = new Date();
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "miercoles", "jueves", "viernes", "sábado", "sabado"];
  const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  for (let i = 1; i <= 30; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const dayName = dayNames[futureDate.getDay()];
    const monthName = monthNames[futureDate.getMonth()];

    if (input.toLowerCase().includes(dayName) || input.toLowerCase().includes(`${futureDate.getDate()} de ${monthName}`)) {
      return futureDate;
    }
  }

  return null;
}

async function classifyIntentWithAI(input: string): Promise<{ intent: string }> {
  try {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: `Clasifica el siguiente mensaje de un paciente en una de estas categorías: agendar_cita, consultar_cita, seguimiento, consulta_general. Responde solo con el nombre de la categoría.\n\nMensaje: "${input}"`,
      },
    ];

    const result = await chat("Eres un clasificador de intents para una clínica médica.", messages);
    return { intent: result.text.trim().toLowerCase() || "consulta_general" };
  } catch {
    return { intent: "consulta_general" };
  }
}

async function saveInboundMessage(msg: IncomingMessage) {
  const patient = await prisma.patient.findFirst({
    where: { whatsappPhone: msg.phone },
  });

  await prisma.whatsAppMessage.create({
    data: {
      phone: msg.phone,
      direction: "INBOUND",
      body: msg.body,
      messageType: "TEXT",
      status: "DELIVERED",
      externalId: msg.whatsappMessageId,
      patientId: patient?.id || null,
    },
  });
}

async function getOrCreateSession(phone: string): Promise<BotSession> {
  const existing = await prisma.whatsAppSession.findUnique({
    where: { phone },
  });

  if (existing && existing.expiresAt > new Date()) {
    return {
      id: existing.id,
      phone: existing.phone,
      currentIntent: existing.currentIntent,
      step: existing.step,
      contextData: JSON.parse(existing.contextData || "{}"),
      expiresAt: existing.expiresAt,
    };
  }

  const newSession = await prisma.whatsAppSession.create({
    data: {
      phone,
      step: "menu",
      contextData: "{}",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return {
    id: newSession.id,
    phone: newSession.phone,
    currentIntent: newSession.currentIntent,
    step: newSession.step,
    contextData: {},
    expiresAt: newSession.expiresAt,
  };
}

async function updateSession(id: string, data: { currentIntent?: string | null; step?: string; contextData?: Record<string, string> }) {
  const session = await prisma.whatsAppSession.update({
    where: { id },
    data: {
      currentIntent: data.currentIntent ?? undefined,
      step: data.step ?? undefined,
      contextData: data.contextData ? JSON.stringify(data.contextData) : undefined,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return {
    id: session.id,
    phone: session.phone,
    currentIntent: session.currentIntent,
    step: session.step,
    contextData: JSON.parse(session.contextData || "{}"),
    expiresAt: session.expiresAt,
  };
}

async function resetSession(session: BotSession) {
  await prisma.whatsAppSession.update({
    where: { id: session.id },
    data: {
      currentIntent: null,
      step: "menu",
      contextData: "{}",
    },
  });
}
