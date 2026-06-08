import { NextRequest, NextResponse } from "next/server";
import { processBotMessage } from "@/lib/whatsapp-bot";

const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET ?? "";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== BOT_INTERNAL_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { phone, message, clinicId, contactName } = body;

  if (!phone || !message) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  try {
    await processBotMessage({ phone, body: message, clinicId, contactName });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Baileys Webhook]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
