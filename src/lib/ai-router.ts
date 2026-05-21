/**
 * Capa de abstracción multi-proveedor de IA para Clínica SaaS.
 *
 * Cada clínica tiene su propio proveedor/modelo/API key almacenado en el
 * modelo Clinic. Si no tiene configuración propia, cae al env var global.
 *
 * Proveedores soportados:
 *   anthropic — Claude (sin restricciones en HN, pero no en NI/CU)
 *   groq      — Llama vía Groq Cloud    (sin restricciones, tier gratuito)
 *   openai    — GPT-4o / GPT-4o-mini    (sin restricciones)
 *   deepseek  — DeepSeek Chat           (sin restricciones, muy económico)
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { prisma } from "./prisma";

// ── Tipos públicos ────────────────────────────────────────────────────────────

export type AiProvider = "anthropic" | "groq" | "openai" | "deepseek";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiResponse {
  text: string;
  isReal: boolean;
  provider?: AiProvider;
}

// ── Modelos disponibles por proveedor ────────────────────────────────────────

export const PROVIDER_MODELS: Record<AiProvider, { id: string; label: string }[]> = {
  anthropic: [
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (rápido, económico)" },
    { id: "claude-sonnet-4-6",         label: "Claude Sonnet 4.6 (balanceado)" },
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (recomendado)" },
    { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B (ultra rápido)" },
  ],
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o Mini (económico)" },
    { id: "gpt-4o",      label: "GPT-4o (máxima calidad)" },
  ],
  deepseek: [
    { id: "deepseek-chat", label: "DeepSeek Chat V3 (muy económico)" },
  ],
};

const OPENAI_COMPAT_BASE: Record<string, string> = {
  groq:     "https://api.groq.com/openai/v1",
  deepseek: "https://api.deepseek.com/v1",
};

// ── Leer config de la clínica ─────────────────────────────────────────────────

interface ProviderConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
}

async function getConfigForClinic(clinicId: string): Promise<ProviderConfig | null> {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { aiProvider: true, aiModel: true, aiApiKey: true },
    });

    const provider = (clinic?.aiProvider ?? "anthropic") as AiProvider;
    const model = clinic?.aiModel ?? PROVIDER_MODELS[provider]?.[0]?.id ?? "claude-haiku-4-5-20251001";

    // Prioridad: config de la clínica → env var global
    let apiKey: string | null = clinic?.aiApiKey ?? null;
    if (!apiKey) {
      if (provider === "anthropic") apiKey = process.env.ANTHROPIC_API_KEY ?? null;
      else if (provider === "groq")  apiKey = process.env.GROQ_API_KEY ?? null;
      else if (provider === "openai") apiKey = process.env.OPENAI_API_KEY ?? null;
      else if (provider === "deepseek") apiKey = process.env.DEEPSEEK_API_KEY ?? null;
    }

    if (!apiKey) return null;
    return { provider, model, apiKey };
  } catch {
    // Fallback si la BD no responde
    const apiKey = process.env.ANTHROPIC_API_KEY ?? null;
    if (!apiKey) return null;
    return { provider: "anthropic", model: "claude-haiku-4-5-20251001", apiKey };
  }
}

// ── Función principal ────────────────────────────────────────────────────────

/**
 * Envía mensajes al proveedor de IA de la clínica y devuelve la respuesta.
 * @param clinicId  ID de la clínica — determina el proveedor/modelo/key a usar
 */
export async function chat(
  clinicId: string,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<AiResponse> {
  const config = await getConfigForClinic(clinicId);

  if (!config) {
    return {
      text: "⚙️ [IA no configurada] Configura un proveedor de IA en el panel de administración.",
      isReal: false,
    };
  }

  const { provider, model, apiKey } = config;

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("IA_TIMEOUT")), 9_000)
  );

  try {
    if (provider === "anthropic") {
      const client = new Anthropic({ apiKey });
      const response = await Promise.race([
        client.messages.create({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        timeout,
      ]);
      const text = response.content[0].type === "text" ? response.content[0].text : "";
      return { text, isReal: true, provider };
    }

    // Proveedores compatibles con OpenAI SDK
    const client = new OpenAI({
      apiKey,
      ...(OPENAI_COMPAT_BASE[provider] ? { baseURL: OPENAI_COMPAT_BASE[provider] } : {}),
    });

    const response = await Promise.race([
      client.chat.completions.create({
        model,
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
      timeout,
    ]);

    const text = response.choices[0]?.message?.content ?? "";
    return { text, isReal: true, provider };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "IA_TIMEOUT";
    console.error(
      isTimeout ? `[AI Router] Timeout — clínica ${clinicId}, proveedor ${provider}` : `[AI Router] Error:`,
      err
    );
    return {
      text: isTimeout ? "FALLBACK_TIMEOUT" : "FALLBACK_ERROR",
      isReal: false,
      provider,
    };
  }
}
