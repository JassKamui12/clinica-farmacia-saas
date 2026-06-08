import { callGroq, getHistory, saveMessage, getAvailableSlots } from "../ai/groqClient";
import { buildSystemPrompt } from "../ai/medicalPrompt";

const NEXT_APP_URL = process.env.NEXT_APP_URL ?? "http://localhost:3000";
const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET ?? "";

interface ClinicInfo {
  id: string;
  name: string;
  rubroId: string;
  aiName: string;
  aiSystemPrompt: string | null;
}

// Cache de clínica para evitar queries repetidas
const clinicCache = new Map<string, { data: ClinicInfo; expires: number }>();

async function getClinicInfo(clinicId: string): Promise<ClinicInfo | null> {
  const cached = clinicCache.get(clinicId);
  if (cached && cached.expires > Date.now()) return cached.data;

  try {
    const res = await fetch(`${NEXT_APP_URL}/api/clinic`, {
      headers: { "X-Internal-Secret": BOT_INTERNAL_SECRET },
    });
    if (!res.ok) return null;
    const data = await res.json() as ClinicInfo;
    clinicCache.set(clinicId, { data, expires: Date.now() + 5 * 60_000 });
    return data;
  } catch {
    return null;
  }
}

async function createAppointment(clinicId: string, payload: {
  service: string;
  fecha: string;
  hora: string;
  patientPhone: string;
  patientName?: string;
  symptoms?: string;
}): Promise<boolean> {
  try {
    // Buscar o crear paciente
    const patientRes = await fetch(`${NEXT_APP_URL}/api/pacientes?q=${encodeURIComponent(payload.patientPhone)}`, {
      headers: { "X-Internal-Secret": BOT_INTERNAL_SECRET },
    });
    const patientData = patientRes.ok
      ? await patientRes.json() as { pacientes: Array<{ id: string }> }
      : { pacientes: [] };
    let patientId = patientData.pacientes?.[0]?.id;

    if (!patientId && payload.patientName) {
      const newPatient = await fetch(`${NEXT_APP_URL}/api/pacientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Internal-Secret": BOT_INTERNAL_SECRET },
        body: JSON.stringify({
          name: payload.patientName,
          phone: payload.patientPhone,
          whatsappPhone: `${payload.patientPhone.replace("+", "")}@s.whatsapp.net`,
          realPhone: payload.patientPhone,
          clinicId,
        }),
      });
      if (newPatient.ok) patientId = ((await newPatient.json()) as { id: string }).id;
    }

    if (!patientId) return false;

    // Obtener primer doctor de la clínica
    const doctorRes = await fetch(`${NEXT_APP_URL}/api/doctores?role=DOCTOR`, {
      headers: { "X-Internal-Secret": BOT_INTERNAL_SECRET },
    });
    const doctors = doctorRes.ok ? await doctorRes.json() as Array<{ id: string }> : [];
    const doctorId = Array.isArray(doctors) && doctors.length > 0 ? doctors[0].id : null;
    if (!doctorId) return false;

    // Crear cita
    const citaRes = await fetch(`${NEXT_APP_URL}/api/citas`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Secret": BOT_INTERNAL_SECRET },
      body: JSON.stringify({
        patientId,
        doctorId,
        date: payload.fecha,
        time: payload.hora,
        service: payload.service,
        reason: payload.symptoms ?? null,
        source: "whatsapp",
        clinicId,
      }),
    });

    return citaRes.ok;
  } catch {
    return false;
  }
}

// Parsear tags del response IA
function parseTags(text: string): { cleanText: string; cita?: { servicio: string; fecha: string; hora: string }; nombre?: string; sintomas?: string } {
  let cleanText = text;
  let cita: { servicio: string; fecha: string; hora: string } | undefined;
  let nombre: string | undefined;
  let sintomas: string | undefined;

  const citaMatch = text.match(/\[CITA:\s*servicio="([^"]+)",\s*fecha="([^"]+)",\s*hora="([^"]+)"\]/);
  if (citaMatch) {
    cita = { servicio: citaMatch[1], fecha: citaMatch[2], hora: citaMatch[3] };
    cleanText = cleanText.replace(citaMatch[0], "").trim();
  }

  const nombreMatch = text.match(/\[NOMBRE:([^\]]+)\]/);
  if (nombreMatch) {
    nombre = nombreMatch[1].trim();
    cleanText = cleanText.replace(nombreMatch[0], "").trim();
  }

  const sintomasMatch = text.match(/\[SINTOMAS:([^\]]+)\]/);
  if (sintomasMatch) {
    sintomas = sintomasMatch[1].trim();
    cleanText = cleanText.replace(sintomasMatch[0], "").trim();
  }

  return { cleanText, cita, nombre, sintomas };
}

export async function handleCitasFlow(params: {
  clinicId: string;
  phone: string;
  message: string;
  contactName?: string;
}): Promise<string> {
  const { clinicId, phone, message, contactName } = params;

  // Guardar mensaje del usuario
  await saveMessage(clinicId, phone, "user", message);

  const [clinic, history, slotsInfo] = await Promise.all([
    getClinicInfo(clinicId),
    getHistory(phone, 10),
    getAvailableSlots(clinicId),
  ]);

  if (!clinic) {
    return "Lo sentimos, no pudimos conectar con la clínica. Intenta de nuevo en unos minutos.";
  }

  const systemPrompt = buildSystemPrompt({
    clinicName: clinic.name,
    rubroId: clinic.rubroId,
    aiName: clinic.aiName,
    aiSystemPrompt: clinic.aiSystemPrompt,
    slotsInfo,
    patientName: contactName,
  });

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-10),
    { role: "user" as const, content: message },
  ];

  const rawReply = await callGroq(messages);
  const { cleanText, cita, nombre, sintomas } = parseTags(rawReply);

  // Si la IA generó una cita, crearla
  if (cita) {
    const created = await createAppointment(clinicId, {
      service: cita.servicio,
      fecha: cita.fecha,
      hora: cita.hora,
      patientPhone: phone,
      patientName: nombre ?? contactName,
      symptoms: sintomas,
    });

    if (created) {
      const confirmMsg = `${cleanText}\n\n✅ Tu cita ha sido agendada:\n📅 ${cita.fecha}\n🕐 ${cita.hora}\n💊 ${cita.servicio}`;
      await saveMessage(clinicId, phone, "assistant", confirmMsg);
      return confirmMsg;
    }
  }

  await saveMessage(clinicId, phone, "assistant", cleanText);
  return cleanText;
}
