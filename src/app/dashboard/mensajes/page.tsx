'use client';

import { useEffect, useState, useRef } from "react";
import { useProfile } from "@/contexts/ProfileContext";

interface Mensaje {
  id: string;
  phone: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversacion {
  phone: string;
  lastMessage: string;
  lastDate: string;
  role: string;
}

export default function MensajesPage() {
  const { profile } = useProfile();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [waStatus, setWaStatus] = useState<"connected" | "disconnected" | "unknown">("unknown");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Cargar conversaciones únicas
  useEffect(() => {
    fetch("/api/whatsapp/messages?limit=200")
      .then((r) => r.json())
      .then((msgs: Mensaje[]) => {
        if (!Array.isArray(msgs)) return;
        const map = new Map<string, Conversacion>();
        [...msgs].reverse().forEach((m) => {
          map.set(m.phone, {
            phone: m.phone,
            lastMessage: m.content,
            lastDate: m.createdAt,
            role: m.role,
          });
        });
        setConversaciones(Array.from(map.values()).reverse());
      })
      .finally(() => setLoading(false));
  }, []);

  // Cargar mensajes de la conversación seleccionada
  useEffect(() => {
    if (!selectedPhone) return;
    setLoadingMsgs(true);
    fetch(`/api/whatsapp/messages?phone=${encodeURIComponent(selectedPhone)}&limit=100`)
      .then((r) => r.json())
      .then((msgs) => { if (Array.isArray(msgs)) setMensajes(msgs); })
      .finally(() => setLoadingMsgs(false));
  }, [selectedPhone]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhone || !reply.trim() || sending) return;
    setSending(true);
    const res = await fetch("/api/whatsapp/send-manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientPhone: selectedPhone, message: reply }),
    });
    if (res.ok) {
      setMensajes((prev) => [
        ...prev,
        { id: crypto.randomUUID(), phone: selectedPhone, role: "owner", content: reply, createdAt: new Date().toISOString() },
      ]);
      setReply("");
    }
    setSending(false);
  }

  const ROLE_STYLE: Record<string, string> = {
    user:      "bg-white border border-slate-200 text-slate-800 self-start rounded-2xl rounded-tl-sm",
    assistant: "bg-[#051125] text-white self-start rounded-2xl rounded-tl-sm",
    owner:     "bg-emerald-600 text-white self-end rounded-2xl rounded-tr-sm",
  };

  return (
    <div className="flex h-[calc(100vh-64px)] lg:h-screen">
      {/* Lista de conversaciones */}
      <div className="w-full lg:w-[280px] border-r border-slate-200 bg-white flex flex-col shrink-0 lg:shrink">
        <div className="px-4 py-4 border-b border-slate-100">
          <h1 className="font-bold text-slate-900">Mensajes WhatsApp</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${waStatus === "connected" ? "bg-emerald-400" : "bg-slate-300"}`} />
            <span className="text-xs text-slate-500">
              {waStatus === "connected" ? "Bot activo" : "Bot desconectado"}
            </span>
          </div>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-2 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : conversaciones.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <span className="material-symbols-outlined text-4xl mb-2">chat</span>
            <p className="text-sm font-medium">Sin conversaciones</p>
            <p className="text-xs mt-1">Los pacientes que escriban por WhatsApp aparecerán aquí</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {conversaciones.map((conv) => {
              const selected = selectedPhone === conv.phone;
              const phoneDisplay = conv.phone.replace("@s.whatsapp.net", "").replace(/(\d{3})(\d{4})(\d{4})/, "+$1 $2-$3");
              return (
                <button
                  key={conv.phone}
                  onClick={() => setSelectedPhone(conv.phone)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${selected ? "bg-slate-50" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#051125]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#051125] text-[18px]">person</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 text-sm truncate">{phoneDisplay}</p>
                    <p className={`text-xs truncate mt-0.5 ${conv.role === "owner" ? "text-emerald-600" : "text-slate-500"}`}>
                      {conv.role === "owner" ? "Tú: " : ""}{conv.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Área de conversación */}
      <div className="flex-1 flex flex-col bg-[#f6fafe]">
        {!selectedPhone ? (
          <div className="flex-1 flex items-center justify-center text-slate-300">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl mb-3 block">chat_bubble</span>
              <p className="font-medium">Selecciona una conversación</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#051125]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#051125] text-[18px]">person</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {selectedPhone.replace("@s.whatsapp.net", "").replace(/(\d{3})(\d{4})(\d{4})/, "+$1 $2-$3")}
                </p>
                <p className="text-xs text-slate-400">Conversación WhatsApp</p>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <span className="text-slate-400 text-sm">Cargando mensajes...</span>
                </div>
              ) : mensajes.length === 0 ? (
                <div className="flex justify-center py-8">
                  <span className="text-slate-400 text-sm">Sin mensajes</span>
                </div>
              ) : (
                mensajes.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "owner" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 text-sm shadow-sm ${ROLE_STYLE[m.role] ?? "bg-white border border-slate-200 self-start rounded-2xl"}`}>
                      {m.role === "assistant" && (
                        <p className="text-[10px] text-blue-300 font-semibold mb-0.5 uppercase tracking-wide">Bot IA</p>
                      )}
                      {m.role === "owner" && (
                        <p className="text-[10px] text-emerald-200 font-semibold mb-0.5 uppercase tracking-wide">
                          {profile?.name ?? "Staff"}
                        </p>
                      )}
                      <p className="leading-relaxed">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.role === "user" ? "text-slate-400" : "text-white/50"}`}>
                        {new Date(m.createdAt).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-4 py-3 bg-white border-t border-slate-200 flex items-center gap-3">
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!reply.trim() || sending}
                className="w-10 h-10 rounded-xl bg-[#051125] text-white flex items-center justify-center hover:bg-[#1b263b] transition-colors disabled:opacity-40 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
