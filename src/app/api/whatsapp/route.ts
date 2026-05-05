import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoints: {
      webhook: "/api/whatsapp/webhook",
      send: "/api/whatsapp/send",
      messages: "/api/whatsapp/messages",
      bot: "Integrado en webhook POST",
    },
    templates: [
      "confirmar_cita",
      "recordatorio_cita_24h",
      "recordatorio_cita_1h",
      "cancelar_cita",
      "seguimiento_tratamiento",
      "alerta_seguimiento",
      "receta_lista",
    ],
  });
}
