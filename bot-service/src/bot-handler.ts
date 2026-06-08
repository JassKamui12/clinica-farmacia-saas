import { handleCitasFlow } from "./flows/citasFlow";
import { handleFarmaciaFlow } from "./flows/farmaciaFlow";

const NEXT_APP_URL = process.env.NEXT_APP_URL ?? "http://localhost:3000";
const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET ?? "";

interface ClinicData {
  id: string;
  name: string;
  rubroId: string;
  aiName: string;
  aiSystemPrompt: string | null;
  slug: string;
}

// Resolver clínica por slug o por única activa
async function resolveClinic(clinicId?: string): Promise<ClinicData | null> {
  if (!clinicId) return null;
  try {
    // Usar endpoint interno de clinic (necesitamos uno sin auth)
    const res = await fetch(`${NEXT_APP_URL}/api/super-admin/clinicas?limit=1`, {
      headers: { "X-Internal-Secret": BOT_INTERNAL_SECRET },
    });
    if (!res.ok) return null;
    const { clinicas } = await res.json() as { clinicas: ClinicData[] };
    return Array.isArray(clinicas) ? clinicas.find((c: ClinicData) => c.id === clinicId) ?? null : null;
  } catch {
    return null;
  }
}

export async function handleMessage(params: {
  phone: string;
  message: string;
  clinicId?: string;
  contactName?: string;
}): Promise<string | null> {
  const { phone, message, clinicId, contactName } = params;

  if (!clinicId) {
    console.warn(`[Bot] Sin clinicId para ${phone}`);
    return null;
  }

  const clinic = await resolveClinic(clinicId);
  if (!clinic) {
    console.warn(`[Bot] No se encontró clínica ${clinicId}`);
    return null;
  }

  console.log(`[Bot] ${phone} → ${clinic.rubroId} | "${message.substring(0, 50)}"`);

  if (clinic.rubroId === "farmacia") {
    return handleFarmaciaFlow({
      clinicId,
      phone,
      message,
      clinicName: clinic.name,
      aiName: clinic.aiName,
      contactName,
    });
  }

  // Todos los demás rubros médicos usan citasFlow
  return handleCitasFlow({ clinicId, phone, message, contactName });
}
