import OpenAI from "openai";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ClaudeResponse {
  text: string;
  isReal: boolean;
}

async function getApiKey(): Promise<string | null> {
  return process.env.DEEPSEEK_API_KEY ?? null;
}

export async function chat(
  systemPrompt: string,
  messages: ChatMessage[],
  model = "deepseek-chat"
): Promise<ClaudeResponse> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    return {
      text: "⚙️ La IA no está configurada. Define DEEPSEEK_API_KEY en tu entorno.",
      isReal: false,
    };
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });

    const response = await client.chat.completions.create({
      model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg) => ({ role: msg.role as "user" | "assistant" | "system", content: msg.content })),
      ],
    });

    const text = response.choices[0]?.message?.content || "";
    return { text, isReal: true };
  } catch (error) {
    console.error("DeepSeek error:", error);
    return {
      text: "Lo siento, hubo un error en la IA. Intenta de nuevo más tarde.",
      isReal: false,
    };
  }
}
