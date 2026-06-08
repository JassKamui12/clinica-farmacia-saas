import OpenAI from "openai";

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const NEXT_APP_URL = process.env.NEXT_APP_URL ?? "http://localhost:3000";
const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET ?? "";

const groq = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function callGroq(messages: Message[]): Promise<string> {
  if (!GROQ_API_KEY) {
    return "Hola, soy el asistente de la clínica. Estoy temporalmente fuera de servicio. Por favor llama directamente a la clínica.";
  }

  const resp = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    max_tokens: 600,
    temperature: 0.4,
  });

  return resp.choices[0]?.message?.content ?? "";
}

// Guardar mensaje en DB via Next.js API
export async function saveMessage(clinicId: string, phone: string, role: string, content: string) {
  try {
    await fetch(`${NEXT_APP_URL}/api/whatsapp/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": BOT_INTERNAL_SECRET,
      },
      body: JSON.stringify({ clinicId, phone, role, content }),
    });
  } catch {
    // Non-fatal
  }
}

// Obtener historial de mensajes desde Next.js API
export async function getHistory(phone: string, limit = 10): Promise<Message[]> {
  try {
    const res = await fetch(
      `${NEXT_APP_URL}/api/whatsapp/messages?phone=${encodeURIComponent(phone)}&limit=${limit}`,
      { headers: { "X-Internal-Secret": BOT_INTERNAL_SECRET } }
    );
    if (!res.ok) return [];
    const msgs = await res.json() as Array<{ role: string; content: string }>;
    return msgs
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  } catch {
    return [];
  }
}

// Obtener slots disponibles de citas para el día de hoy y mañana
export async function getAvailableSlots(clinicId: string): Promise<string> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(
      `${NEXT_APP_URL}/api/citas?date=${today}&clinicId=${clinicId}`,
      { headers: { "X-Internal-Secret": BOT_INTERNAL_SECRET } }
    );
    if (!res.ok) return "hoy y mañana de 8:00 AM a 5:00 PM";
    const { citas } = await res.json() as { citas: Array<{ time: string }> };
    const booked = (citas as Array<{ time: string }>).map((c) => c.time);
    const allSlots = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30"];
    const free = allSlots.filter((s) => !booked.includes(s));
    if (free.length === 0) return "No hay citas disponibles hoy. Mañana puedo ofrecerte horarios.";
    return `Horarios disponibles hoy: ${free.slice(0, 6).join(", ")}`;
  } catch {
    return "de lunes a viernes de 8:00 AM a 5:00 PM";
  }
}
