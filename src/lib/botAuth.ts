import { NextRequest } from "next/server";

const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET ?? "";

// Verifica que la request viene del bot-service
export function isBotRequest(req: NextRequest): boolean {
  return (
    !!BOT_INTERNAL_SECRET &&
    req.headers.get("x-internal-secret") === BOT_INTERNAL_SECRET
  );
}
