import { callGroq, getHistory, saveMessage } from "../ai/groqClient";

const NEXT_APP_URL = process.env.NEXT_APP_URL ?? "http://localhost:3000";
const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET ?? "";

interface Producto {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  indications: string | null;
  contraindications: string | null;
  price: number;
  stock: number;
  requiresPrescription: boolean;
  unit: string;
}

async function getProductos(clinicId: string): Promise<Producto[]> {
  try {
    const res = await fetch(`${NEXT_APP_URL}/api/farmacia/productos?clinicId=${clinicId}`, {
      headers: { "X-Internal-Secret": BOT_INTERNAL_SECRET },
    });
    if (!res.ok) return [];
    return await res.json() as Producto[];
  } catch {
    return [];
  }
}

function buildFarmaciaSystemPrompt(clinicName: string, aiName: string, productos: Producto[]): string {
  const catalogoLines = productos.map((p) => {
    const stock = p.stock === 0 ? "AGOTADO" : `${p.stock} ${p.unit}s`;
    const receta = p.requiresPrescription ? " [REQUIERE RECETA]" : "";
    const usos = p.indications ? `\n    Indicado para: ${p.indications}` : "";
    const desc = p.description ? `\n    Descripción: ${p.description}` : "";
    const contra = p.contraindications ? `\n    Contraindicaciones: ${p.contraindications}` : "";
    return `- ${p.name}: L ${p.price.toFixed(2)}, Stock: ${stock}${receta}${usos}${desc}${contra}`;
  }).join("\n");

  return `Eres ${aiName}, el asistente de ${clinicName}.

Eres un asistente de farmacia. Tu función es:
1. Verificar disponibilidad y precio de medicamentos
2. Explicar para qué sirve un producto usando la info de "Indicado para" / "Descripción" del catálogo
3. Informar si el medicamento requiere receta médica
4. Crear pedidos cuando el paciente confirme

CATÁLOGO ACTUAL:
${catalogoLines || "Catálogo no disponible en este momento."}

REGLAS:
- Responde en español, de forma breve y profesional.
- Si un medicamento está AGOTADO, informa y ofrece alternativas si las hay.
- Si requiere receta, infórmalo claramente y pide que la traiga.
- NO recomiendes dosis ni sustituyas la opinión médica.
- Cuando el paciente confirme un pedido, incluye al FINAL:
  [PEDIDO: medicamento="NOMBRE", cantidad=N]`.trim();
}

export async function handleFarmaciaFlow(params: {
  clinicId: string;
  phone: string;
  message: string;
  clinicName: string;
  aiName: string;
  contactName?: string;
}): Promise<string> {
  const { clinicId, phone, message, clinicName, aiName } = params;

  await saveMessage(clinicId, phone, "user", message);

  const [history, productos] = await Promise.all([
    getHistory(phone, 8),
    getProductos(clinicId),
  ]);

  const systemPrompt = buildFarmaciaSystemPrompt(clinicName, aiName, productos);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-8),
    { role: "user" as const, content: message },
  ];

  const rawReply = await callGroq(messages);

  // Parsear pedido si existe
  const pedidoMatch = rawReply.match(/\[PEDIDO:\s*medicamento="([^"]+)",\s*cantidad=(\d+)\]/);
  let cleanReply = rawReply.replace(/\[PEDIDO:[^\]]+\]/g, "").trim();

  if (pedidoMatch) {
    const medNombre = pedidoMatch[1];
    const cantidad = parseInt(pedidoMatch[2]);
    const producto = productos.find((p) => p.name.toLowerCase().includes(medNombre.toLowerCase()));

    if (producto && producto.stock >= cantidad) {
      const confirmMsg = `${cleanReply}\n\n✅ Pedido registrado:\n💊 ${medNombre} x${cantidad}\n💰 Total: L ${(producto.price * cantidad).toFixed(2)}\n\nPasa por la farmacia para retirar tu pedido.`;
      await saveMessage(clinicId, phone, "assistant", confirmMsg);
      return confirmMsg;
    }
  }

  await saveMessage(clinicId, phone, "assistant", cleanReply);
  return cleanReply;
}
