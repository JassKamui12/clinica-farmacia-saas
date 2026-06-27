import "dotenv/config";
import express from "express";
import cors from "cors";
import { BaileysClient } from "./baileys-client";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3002");
const INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET ?? "";

app.use(cors());
app.use(express.json());

const baileysClient = new BaileysClient();

function checkSecret(req: express.Request, res: express.Response): boolean {
  const secret = req.headers["x-internal-secret"];
  if (secret !== INTERNAL_SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "baileys-bot" });
});

app.get("/status", (req, res) => {
  if (!checkSecret(req, res)) return;
  res.json(baileysClient.getStatus());
});

app.get("/qr", (req, res) => {
  if (!checkSecret(req, res)) return;
  const status = baileysClient.getStatus();
  if (status.qr) {
    res.json({ qr: status.qr });
  } else {
    res.json({ qr: null, connected: status.connected });
  }
});

app.post("/send", async (req, res) => {
  if (!checkSecret(req, res)) return;
  const { phone, message } = req.body;
  if (!phone || !message) {
    res.status(400).json({ error: "Faltan phone o message" });
    return;
  }
  const result = await baileysClient.sendMessage(phone, message);
  res.json(result);
});

app.post("/disconnect", async (req, res) => {
  if (!checkSecret(req, res)) return;
  await baileysClient.disconnect();
  res.json({ ok: true });
});

// Scheduler de recordatorios: este servicio corre 24/7, así que dispara el
// cron de la app (recordatorios de cita, check-ins y campañas) cada 30 min.
const NEXT_APP_URL = process.env.NEXT_APP_URL ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";
const REMINDERS_INTERVAL_MS = 30 * 60 * 1000;

async function runReminders() {
  if (!NEXT_APP_URL || !CRON_SECRET) return;
  try {
    const res = await fetch(`${NEXT_APP_URL}/api/cron/reminders?secret=${CRON_SECRET}`);
    const data = await res.json().catch(() => ({}));
    console.log(`[Reminders] tick ${res.status}`, JSON.stringify(data));
  } catch (err) {
    console.error("[Reminders] error:", err);
  }
}

app.listen(PORT, () => {
  console.log(`[Bot Service] Corriendo en puerto ${PORT}`);
  baileysClient.connect();

  if (NEXT_APP_URL && CRON_SECRET) {
    console.log(`[Reminders] scheduler activo (cada ${REMINDERS_INTERVAL_MS / 60000} min)`);
    setInterval(runReminders, REMINDERS_INTERVAL_MS);
  } else {
    console.warn("[Reminders] scheduler inactivo: faltan NEXT_APP_URL o CRON_SECRET");
  }
});
