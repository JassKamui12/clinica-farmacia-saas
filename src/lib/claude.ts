import { Anthropic } from "@anthropic-ai/sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeResponse {
  text: string;
  isReal: boolean;
}

async function getApiKey(): Promise<string | null> {
  return process.env.ANTHROPIC_API_KEY ?? null;
}

export async function chat(
  systemPrompt: string,
  messages: ChatMessage[],
  model = "claude-3-5-haiku-20241022"
): Promise<ClaudeResponse> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    return {
      text: "⚙️ La IA no está configurada. Define ANTHROPIC_API_KEY en tu entorno.",
      isReal: false,
    };
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return { text, isReal: true };
  } catch (error) {
    console.error("Claude error:", error);
    return {
      text: "Lo siento, hubo un error en la IA. Intenta de nuevo más tarde.",
      isReal: false,
    };
  }
}
