/**
 * Motor de IA conversacional para la clínica/farmacia SaaS.
 *
 * Flujo por mensaje entrante:
 *  1. Guardar mensaje INBOUND
 *  2. Verificar human takeover (5 min timeout)
 *  3. Identificar/crear paciente
 *  4. Cargar contexto: doctores, citas, seguimientos, farmacia
 *  5. Construir system prompt con contexto real
 *  6. Normalizar historial (max 20 msgs, roles user/assistant)
 *  7. Llamar a AI router (proveedor configurado por clínica)
 *  8. Parsear tags de acción en la respuesta
 *  9. Ejecutar acciones ([CITA:...], [ALERTA:...], [CHECK:...])
 * 10. Guardar respuesta OUTBOUND
 * 11. Devolver texto para enviar por WhatsApp
 */

import { prisma } from "./prisma";
import { chat, ChatMessage } from "./ai-router";

const MAX_HISTORY = 20;
const TAKEOVER_TIMEOUT_MS = 5 * 60 * 1000;

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface ClinicHandlerResult {
  reply: string;
  paused: boolean;
  appointmentCreated?: boolean;
  alertTriggered?: boolean;
}

// ── Función principal ────────────────────────────────────────────────────────

export async function processClinicMessage(
  clinicId: string,
  patientPhone: string,
  text: string,
  contactName?: string
): Promise<ClinicHandlerResult> {

  // 1. Guardar mensaje entrante
  await prisma.whatsAppMessage.create({
    data: {
      clinicId,
      phone: patientPhone,
      direction: "INBOUND",
      body: text,
      messageType: "TEXT",
      status: "DELIVERED",
    },
  });

  // 2. Verificar human takeover
  const session = await prisma.whatsAppSession.findUnique({
    where: { phone: patientPhone },
    select: { id: true, ownerTakenOver: true, ownerLastMessageAt: true },
  });

  if (session?.ownerTakenOver) {
    const elapsed = session.ownerLastMessageAt
      ? Date.now() - new Date(session.ownerLastMessageAt).getTime()
      : Infinity;

    if (elapsed < TAKEOVER_TIMEOUT_MS) {
      console.log(`[Clínica IA] Bot pausado — modo manual para ${patientPhone}`);
      return { reply: "", paused: true };
    }

    // Auto-reactivar
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { ownerTakenOver: false, ownerLastMessageAt: null },
    });
  }

  // 3. Identificar / crear paciente
  let patient = await prisma.patient.findFirst({
    where: { clinicId, whatsappPhone: patientPhone },
  });

  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        clinicId,
        whatsappPhone: patientPhone,
        name: contactName ?? `Paciente ${patientPhone.slice(-4)}`,
      },
    });
  } else if (contactName && patient.name.startsWith("Paciente ")) {
    patient = await prisma.patient.update({
      where: { id: patient.id },
      data: { name: contactName },
    });
  }

  // 4. Cargar contexto en paralelo
  const [clinic, doctors, upcomingAppointments, activeFollowUp, lastPrescription, pharmacyProducts, history] =
    await Promise.all([
      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { name: true, type: true, aiName: true, aiSystemPrompt: true },
      }),
      prisma.user.findMany({
        where: { clinicId, role: "DOCTOR" },
        select: { id: true, name: true, specialty: true },
      }),
      prisma.appointment.findMany({
        where: {
          clinicId,
          patientId: patient.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          date: { gte: new Date() },
        },
        include: { User: { select: { name: true, specialty: true } } },
        orderBy: { date: "asc" },
        take: 3,
      }),
      prisma.patientFollowUp.findFirst({
        where: { clinicId, patientId: patient.id, status: "ACTIVE" },
        include: { Prescription: { select: { productName: true, dosage: true, instructions: true } } },
      }),
      prisma.prescription.findFirst({
        where: { clinicId, patientId: patient.id },
        include: { User: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      // Farmacia: solo si la clínica es PHARMACY o COMBINED
      prisma.pharmacyProduct.findMany({
        where: { clinicId, isAvailable: true },
        select: { name: true, category: true, price: true, stock: true },
        take: 20,
      }),
      prisma.whatsAppMessage.findMany({
        where: { clinicId, phone: patientPhone },
        orderBy: { createdAt: "desc" },
        take: MAX_HISTORY,
      }),
    ]);

  // 5. Construir system prompt
  const systemPrompt = buildSystemPrompt({
    clinic: clinic ?? { name: "Clínica", type: "MEDICAL", aiName: "Asistente", aiSystemPrompt: null },
    patient: { name: patient.name, allergies: patient.allergies, bloodType: patient.bloodType },
    doctors,
    upcomingAppointments,
    activeFollowUp,
    lastPrescription,
    pharmacyProducts,
  });

  // 6. Normalizar historial (owner → assistant, fusionar consecutivos)
  const chatHistory: ChatMessage[] = history
    .reverse()
    .map((m) => ({
      role: (m.direction === "INBOUND" ? "user" : "assistant") as "user" | "assistant",
      content: m.body ?? "",
    }))
    .filter((m) => m.content.trim())
    .reduce<ChatMessage[]>((acc, msg) => {
      const last = acc[acc.length - 1];
      if (last && last.role === msg.role) {
        last.content += "\n\n" + msg.content;
      } else {
        acc.push({ ...msg });
      }
      return acc;
    }, []);

  // 7. Llamar a la IA
  let { text: reply, isReal } = await chat(clinicId, systemPrompt, [
    ...chatHistory,
    { role: "user", content: text },
  ]);

  if (!isReal || reply === "FALLBACK_TIMEOUT" || reply === "FALLBACK_ERROR") {
    const clinicName = clinic?.name ?? "la clínica";
    reply = `Hola, soy el asistente de *${clinicName}*. En este momento tengo dificultades técnicas. Por favor escríbeme de nuevo en un momento o llama directamente a la clínica. ¡Disculpa el inconveniente!`;
  }

  // 8 + 9. Parsear y ejecutar acciones
  let appointmentCreated = false;
  let alertTriggered = false;
  let cleanReply = reply;

  // Capturar nombre del paciente si la IA lo obtuvo
  const nameMatch = reply.match(/\[NOMBRE:([^\]]+)\]/);
  if (nameMatch) {
    const nombre = nameMatch[1].trim();
    if (nombre) {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: { name: nombre },
      });
    }
    cleanReply = cleanReply.replace(/\[NOMBRE:[^\]]+\]/g, "").trim();
  }

  // Crear cita: [CITA: doctorId="X", fecha="YYYY-MM-DD", hora="HH:MM"]
  const citaMatch = cleanReply.match(/\[CITA:\s*doctorId="([^"]+)",\s*fecha="([^"]+)",\s*hora="([^"]+)"\]/);
  if (citaMatch) {
    const [, doctorId, fecha, hora] = citaMatch;
    const appointmentDate = new Date(`${fecha}T${hora}:00`);

    if (!isNaN(appointmentDate.getTime())) {
      // Verificar que el doctor pertenece a esta clínica
      const doctor = doctors.find((d) => d.id === doctorId);
      if (doctor) {
        await prisma.appointment.create({
          data: {
            clinicId,
            patientId: patient.id,
            doctorId,
            date: appointmentDate,
            time: hora,
            status: "CONFIRMED",
            reason: "Agendada por IA vía WhatsApp",
            whatsappConfirmed: true,
          },
        });
        appointmentCreated = true;

        // Notificación interna para el doctor
        await prisma.notification.create({
          data: {
            clinicId,
            title: "Nueva cita agendada por IA",
            content: `${patient.name} · ${doctor.name ?? "Doctor"} · ${appointmentDate.toLocaleString("es-HN")}`,
            channel: "in_app",
            role: "DOCTOR",
          },
        }).catch(() => {});
      }
    }
    cleanReply = cleanReply.replace(/\[CITA:[^\]]+\]/g, "").trim();
  }

  // Alerta médica: [ALERTA: motivo="X"]
  const alertaMatch = cleanReply.match(/\[ALERTA:\s*motivo="([^"]+)"\]/);
  if (alertaMatch) {
    const motivo = alertaMatch[1];
    alertTriggered = true;

    if (activeFollowUp) {
      await prisma.patientFollowUp.update({
        where: { id: activeFollowUp.id },
        data: { alertTriggered: true, alertReason: motivo, status: "ALERT" },
      });
    }

    await prisma.notification.create({
      data: {
        clinicId,
        title: `⚠️ Alerta de paciente: ${patient.name}`,
        content: motivo,
        channel: "in_app",
        role: "DOCTOR",
      },
    }).catch(() => {});

    cleanReply = cleanReply.replace(/\[ALERTA:[^\]]+\]/g, "").trim();
  }

  // Check de seguimiento: [CHECK: estado="ok"|"alerta"|"no_adherente"]
  const checkMatch = cleanReply.match(/\[CHECK:\s*estado="([^"]+)"\]/);
  if (checkMatch && activeFollowUp) {
    const estado = checkMatch[1];
    await prisma.patientFollowUp.update({
      where: { id: activeFollowUp.id },
      data: {
        lastCheckIn: new Date(),
        adherenceScore:
          estado === "ok"
            ? Math.min(100, activeFollowUp.adherenceScore + 5)
            : estado === "no_adherente"
            ? Math.max(0, activeFollowUp.adherenceScore - 20)
            : Math.max(0, activeFollowUp.adherenceScore - 10),
        ...(estado === "alerta" ? { alertTriggered: true, status: "ALERT" } : {}),
        ...(estado === "no_adherente" ? { status: "NON_ADHERENT" } : {}),
      },
    });
    cleanReply = cleanReply.replace(/\[CHECK:[^\]]+\]/g, "").trim();
  }

  // 10. Guardar respuesta de la IA
  await prisma.whatsAppMessage.create({
    data: {
      clinicId,
      patientId: patient.id,
      phone: patientPhone,
      direction: "OUTBOUND",
      body: cleanReply,
      messageType: "TEXT",
      status: "SENT",
    },
  });

  return { reply: cleanReply, paused: false, appointmentCreated, alertTriggered };
}

// ── System Prompt ────────────────────────────────────────────────────────────

interface PromptParams {
  clinic: { name: string; type: string; aiName: string; aiSystemPrompt: string | null };
  patient: { name: string; allergies: string | null; bloodType: string | null };
  doctors: { id: string; name: string | null; specialty: string | null }[];
  upcomingAppointments: {
    date: Date; time: string; status: string;
    User: { name: string | null; specialty: string | null } | null;
  }[];
  activeFollowUp: {
    Prescription: { productName: string; dosage: string | null; instructions: string | null } | null;
  } | null;
  lastPrescription: {
    productName: string; dosage: string | null;
    User: { name: string | null } | null;
  } | null;
  pharmacyProducts: { name: string; category: string | null; price: number; stock: number }[];
}

function buildSystemPrompt(p: PromptParams): string {
  // Si la clínica tiene un prompt personalizado, usarlo como base
  if (p.clinic.aiSystemPrompt?.trim()) {
    return p.clinic.aiSystemPrompt
      .replace(/\{\{clinicName\}\}/g, p.clinic.name)
      .replace(/\{\{aiName\}\}/g, p.clinic.aiName);
  }

  const clinicTypeLabel =
    p.clinic.type === "DENTAL" ? "clínica dental" :
    p.clinic.type === "PHARMACY" ? "farmacia" :
    p.clinic.type === "COMBINED" ? "clínica médica con farmacia" :
    "clínica médica";

  const doctorList = p.doctors.length
    ? p.doctors.map((d) => `• ${d.name ?? "Doctor"} — ${d.specialty ?? "Medicina General"} (ID: ${d.id})`).join("\n")
    : "No hay doctores registrados aún.";

  const appointmentList = p.upcomingAppointments.length
    ? p.upcomingAppointments.map((a) => {
        const fecha = new Date(a.date).toLocaleDateString("es-HN", { weekday: "long", day: "numeric", month: "long" });
        return `• ${fecha} a las ${a.time} con ${a.User?.name ?? "Doctor"} — ${a.status}`;
      }).join("\n")
    : "Sin citas próximas.";

  const followUpInfo = p.activeFollowUp
    ? `Medicamento activo: ${p.activeFollowUp.Prescription?.productName ?? "tratamiento"} — ${p.activeFollowUp.Prescription?.dosage ?? ""} ${p.activeFollowUp.Prescription?.instructions ?? ""}`
    : "Sin seguimiento activo.";

  const pharmacyInfo =
    p.pharmacyProducts.length
      ? p.pharmacyProducts
          .map((pr) => `• ${pr.name} — L ${pr.price} (stock: ${pr.stock})`)
          .join("\n")
      : "";

  const patientAllergies = p.patient.allergies ? `\nAlergias conocidas: ${p.patient.allergies}` : "";
  const patientBlood = p.patient.bloodType ? `\nTipo de sangre: ${p.patient.bloodType}` : "";

  return `Eres ${p.clinic.aiName}, el asistente virtual de *${p.clinic.name}*, una ${clinicTypeLabel}.

PACIENTE ACTUAL:
Nombre: ${p.patient.name}${patientAllergies}${patientBlood}

CITAS PRÓXIMAS:
${appointmentList}

SEGUIMIENTO DE TRATAMIENTO:
${followUpInfo}

${lastPrescriptionSection(p.lastPrescription)}

MÉDICOS DISPONIBLES:
${doctorList}

${pharmacyInfo ? `FARMACIA (productos disponibles):\n${pharmacyInfo}\n` : ""}

CAPACIDADES Y REGLAS:
1. Sé empático, cálido y profesional. El paciente puede estar preocupado.
2. Puedes agendar citas, consultar citas, dar seguimiento y responder sobre farmacia.
3. Para AGENDAR una cita confirmada, incluye al final:
   [CITA: doctorId="ID_DEL_DOCTOR", fecha="YYYY-MM-DD", hora="HH:MM"]
   Solo incluye este tag CUANDO el paciente confirme explícitamente.
4. Si el paciente reporta síntomas graves (dolor en el pecho, dificultad para respirar, etc.),
   responde con empatía, incluye [ALERTA: motivo="descripción breve"] e indica llamar al 911.
5. Para actualizar seguimiento de tratamiento después del check-in, incluye:
   [CHECK: estado="ok"] o [CHECK: estado="alerta"] o [CHECK: estado="no_adherente"]
6. Si el paciente dice su nombre, incluye [NOMBRE:nombre_aquí] para guardarlo (invisible para él).
7. Para EMERGENCIAS siempre indica llamar al 911 o acudir a urgencias.
8. Si no puedes ayudar, ofrece conectar con un humano de la clínica.
9. Responde en español, sé breve y natural. Usa WhatsApp formatting (*negrita*) con moderación.
10. No compartas datos médicos de otros pacientes. Nunca inventes diagnósticos definitivos.`;
}

function lastPrescriptionSection(
  p: { productName: string; dosage: string | null; User: { name: string | null } | null } | null
): string {
  if (!p) return "";
  return `ÚLTIMA RECETA:\n• ${p.productName} — ${p.dosage ?? "sin dosis especificada"} (Dr. ${p.User?.name ?? "No asignado"})\n`;
}
