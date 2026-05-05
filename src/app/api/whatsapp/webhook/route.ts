import { NextRequest, NextResponse } from "next/server";
import { processWebhookStatus } from "@/lib/whatsapp";
import { processBotMessage } from "@/lib/whatsapp-bot";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.object === "whatsapp_business_account") {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.value.statuses) {
          await processWebhookStatus(change.value.statuses);
        }

        if (change.value.messages) {
          for (const message of change.value.messages) {
            const phone = change.value.metadata?.phone_number || entry.id;
            const messageBody = message.text?.body || "";
            const interactiveResponse = message.interactive?.button_reply?.title ||
              message.interactive?.list_reply?.title || "";

            const fullBody = interactiveResponse || messageBody;

            await processBotMessage({
              phone,
              body: fullBody,
              whatsappMessageId: message.id,
              rawMessage: message,
            });
          }
        }
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}
