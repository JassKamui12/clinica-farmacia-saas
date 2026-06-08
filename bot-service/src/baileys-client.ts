import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WAMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as fs from "fs";
import pino from "pino";
import { handleMessage } from "./bot-handler";

const AUTH_FOLDER = process.env.AUTH_FOLDER ?? "./baileys-auth-info";
const DEFAULT_CLINIC_ID = process.env.DEFAULT_CLINIC_ID ?? "";

const logger = pino({ level: "silent" });

export interface BaileysStatus {
  connected: boolean;
  phone?: string;
  qr?: string;
  state: "disconnected" | "connecting" | "qr_ready" | "connected";
}

export class BaileysClient {
  private sock: ReturnType<typeof makeWASocket> | null = null;
  private status: BaileysStatus = { connected: false, state: "disconnected" };
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  getStatus(): BaileysStatus {
    return this.status;
  }

  async connect() {
    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    this.status = { connected: false, state: "connecting" };
    console.log("[Baileys] Conectando a WhatsApp...");

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: true,
      browser: ["Clinica SaaS", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
    });

    this.sock.ev.on("creds.update", saveCreds);

    this.sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("[Baileys] QR generado — escanea con WhatsApp");
        this.status = { connected: false, state: "qr_ready", qr };
      }

      if (connection === "open") {
        const phone = this.sock?.user?.id?.split(":")[0] ?? "";
        console.log(`[Baileys] Conectado como ${phone}`);
        this.status = { connected: true, state: "connected", phone };
        this.reconnectAttempts = 0;
      }

      if (connection === "close") {
        const err = lastDisconnect?.error as Boom | undefined;
        const statusCode = err?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[Baileys] Desconectado. Código: ${statusCode}. Reconectar: ${shouldReconnect}`);
        this.status = { connected: false, state: "disconnected" };

        if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(5000 * this.reconnectAttempts, 30000);
          console.log(`[Baileys] Reintentando en ${delay / 1000}s (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.connect(), delay);
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log("[Baileys] Sesión cerrada — borrando credenciales");
          fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          setTimeout(() => this.connect(), 3000);
        }
      }
    });

    this.sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const msg of messages) {
        if (!msg.key.fromMe && msg.message) {
          await this.handleIncomingMessage(msg);
        }
      }
    });
  }

  private async handleIncomingMessage(msg: WAMessage) {
    const phone = msg.key.remoteJid?.replace("@s.whatsapp.net", "") ?? "";
    if (!phone || phone.includes("@g.us")) return; // skip grupos

    const text =
      msg.message?.conversation ??
      msg.message?.extendedTextMessage?.text ??
      "";

    if (!text.trim()) return;

    const contactName = msg.pushName ?? undefined;
    console.log(`[Baileys] Mensaje de ${phone}: ${text.substring(0, 60)}`);

    try {
      const reply = await handleMessage({
        phone,
        message: text,
        clinicId: DEFAULT_CLINIC_ID,
        contactName,
      });

      if (reply) {
        await this.sendMessage(phone, reply);
      }
    } catch (error) {
      console.error("[Baileys] Error procesando mensaje:", error);
    }
  }

  async sendMessage(phone: string, text: string): Promise<{ success: boolean; error?: string }> {
    if (!this.sock || !this.status.connected) {
      return { success: false, error: "Baileys no conectado" };
    }

    try {
      const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text });
      return { success: true };
    } catch (error) {
      console.error("[Baileys] Error enviando mensaje:", error);
      return { success: false, error: String(error) };
    }
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.status = { connected: false, state: "disconnected" };
    }
  }
}
