'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface WhatsAppMessage {
  id: string;
  phone: string;
  direction: "INBOUND" | "OUTBOUND";
  body?: string | null;
  messageType: string;
  status: string;
  intent?: string | null;
  createdAt: string;
  patient?: { name: string; whatsappPhone?: string | null } | null;
}

interface Conversation {
  phone: string;
  lastMessage: WhatsAppMessage;
  patient?: { id: string; name: string; whatsappPhone?: string | null } | null;
  ownerTakenOver: boolean;
}

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";

export default function WhatsAppPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<WhatsAppMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [toast, setToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.phone === selectedPhone);
  const clinicId = (session?.user as any)?.clinicId as string | undefined;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/whatsapp/messages?limit=200");
    if (!res.ok) return;
    const msgs: WhatsAppMessage[] = await res.json();

    // Group by phone
    const groups: Record<string, { lastMessage: WhatsAppMessage; patient?: any }> = {};
    for (const msg of msgs) {
      if (!groups[msg.phone]) {
        groups[msg.phone] = { lastMessage: msg, patient: msg.patient ?? undefined };
      } else if (new Date(msg.createdAt) > new Date(groups[msg.phone].lastMessage.createdAt)) {
        groups[msg.phone].lastMessage = msg;
        if (msg.patient) groups[msg.phone].patient = msg.patient;
      }
    }

    // Fetch takeover status for all phones in parallel (batch up to 10)
    const phones = Object.keys(groups);
    const statusResults = await Promise.all(
      phones.map((p) =>
        fetch(`/api/whatsapp/sessions?phone=${encodeURIComponent(p)}`)
          .then((r) => r.json())
          .catch(() => ({ ownerTakenOver: false }))
      )
    );

    const convList: Conversation[] = phones.map((phone, i) => ({
      phone,
      lastMessage: groups[phone].lastMessage,
      patient: groups[phone].patient,
      ownerTakenOver: statusResults[i]?.ownerTakenOver ?? false,
    }));

    convList.sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    setConversations(convList);
    if (!selectedPhone && convList.length) setSelectedPhone(convList[0].phone);
  }, [selectedPhone]);

  const loadChat = useCallback(async (phone: string) => {
    const res = await fetch(`/api/whatsapp/messages?phone=${encodeURIComponent(phone)}&limit=100`);
    if (res.ok) setChatMessages(await res.json());
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") loadConversations();
  }, [status]);

  useEffect(() => {
    if (selectedPhone) loadChat(selectedPhone);
  }, [selectedPhone]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Poll conversations every 15 s
  useEffect(() => {
    const id = setInterval(() => {
      loadConversations();
      if (selectedPhone) loadChat(selectedPhone);
    }, 15000);
    return () => clearInterval(id);
  }, [loadConversations, loadChat, selectedPhone]);

  async function sendReply() {
    if (!replyText.trim() || !selectedPhone || !clinicId) return;
    setLoading(true);
    const res = await fetch("/api/whatsapp/send-manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientPhone: selectedPhone, message: replyText, clinicId }),
    });
    if (res.ok) {
      setReplyText("");
      await loadChat(selectedPhone);
      // Update takeover flag locally
      setConversations((prev) =>
        prev.map((c) => (c.phone === selectedPhone ? { ...c, ownerTakenOver: true } : c))
      );
    } else {
      const err = await res.json();
      showToast(err.error || "Error al enviar mensaje");
    }
    setLoading(false);
  }

  async function handleResume() {
    if (!selectedPhone) return;
    setResuming(true);
    const res = await fetch("/api/whatsapp/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientPhone: selectedPhone }),
    });
    if (res.ok) {
      setConversations((prev) =>
        prev.map((c) => (c.phone === selectedPhone ? { ...c, ownerTakenOver: false } : c))
      );
      showToast("IA reactivada para esta conversación");
    }
    setResuming(false);
  }

  const filteredConversations = conversations.filter(
    (c) =>
      c.phone.includes(searchQuery) ||
      (c.patient?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar
        activePath="/whatsapp"
        userRole={(session?.user.role ?? "ADMIN") as AppRole}
        userName={session?.user.name}
        userEmail={session?.user.email}
      />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">WhatsApp — Conversaciones</h1>
            <p className="text-slate-500 mt-1">Responde manualmente o deja que la IA atienda a los pacientes</p>
          </div>

          {toast && (
            <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 px-4 py-3 text-sm text-[#00F5A0]">
              {toast}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-3" style={{ height: "calc(100vh - 210px)" }}>
            {/* ── Conversation list ─────────────────────────────────────────── */}
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#30363D]">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar paciente o teléfono..."
                  className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2 text-sm text-slate-200 outline-none focus:border-[#25D366]"
                />
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#30363D]">
                {filteredConversations.length === 0 ? (
                  <p className="text-slate-500 text-center py-12 text-sm">Sin conversaciones</p>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.phone}
                      onClick={() => setSelectedPhone(conv.phone)}
                      className={`w-full text-left p-4 hover:bg-[#0A0C10] transition-colors ${
                        selectedPhone === conv.phone
                          ? "bg-[#0A0C10] border-l-4 border-l-[#25D366]"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-100 text-sm truncate">
                            {conv.patient?.name || conv.phone}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[170px] mt-0.5">
                            {conv.lastMessage.body || "Sin mensaje"}
                          </p>
                          {conv.ownerTakenOver && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full">
                              <span className="material-symbols-outlined text-xs">person</span>
                              Modo manual
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-600">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString("es-HN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <span
                            className={`text-sm font-bold ${
                              conv.lastMessage.direction === "INBOUND"
                                ? "text-[#25D366]"
                                : "text-[#00D9FF]"
                            }`}
                          >
                            {conv.lastMessage.direction === "INBOUND" ? "↓" : "↑"}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ── Chat view ─────────────────────────────────────────────────── */}
            <div className="xl:col-span-2 rounded-2xl border border-[#30363D] bg-[#161B22] flex flex-col overflow-hidden">
              {selectedPhone ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-[#30363D] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-100">
                        {selectedConv?.patient?.name || selectedPhone}
                      </p>
                      <p className="text-xs text-slate-500">{selectedPhone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedConv?.ownerTakenOver ? (
                        <span className="flex items-center gap-1.5 text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20 px-3 py-1.5 rounded-full">
                          <span className="material-symbols-outlined text-sm">person</span>
                          Modo manual activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 px-3 py-1.5 rounded-full">
                          <span className="material-symbols-outlined text-sm">smart_toy</span>
                          IA activa
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Takeover banner */}
                  {selectedConv?.ownerTakenOver && (
                    <div className="px-4 py-3 bg-amber-400/5 border-b border-amber-400/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-400 text-sm">info</span>
                        <p className="text-xs text-amber-300">
                          La IA está en pausa para esta conversación. Reactivarla para que el bot retome el control.
                        </p>
                      </div>
                      <button
                        onClick={handleResume}
                        disabled={resuming}
                        className="shrink-0 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-medium px-3 py-1.5 hover:bg-amber-400/20 transition-colors disabled:opacity-50"
                      >
                        {resuming ? "Reactivando..." : "Reactivar IA"}
                      </button>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 ? (
                      <p className="text-slate-500 text-center py-12 text-sm">Sin mensajes</p>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[72%] rounded-2xl px-4 py-3 ${
                              msg.direction === "OUTBOUND"
                                ? "bg-[#25D366]/10 border border-[#25D366]/20"
                                : "bg-[#0A0C10] border border-[#30363D]"
                            }`}
                          >
                            <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                              {msg.body}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <p className="text-xs text-slate-600">
                                {new Date(msg.createdAt).toLocaleString("es-HN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                              {msg.intent && msg.intent !== "manual" && (
                                <span className="text-xs bg-purple-400/10 text-purple-400 px-2 py-0.5 rounded-full">
                                  {msg.intent}
                                </span>
                              )}
                              {msg.intent === "manual" && (
                                <span className="text-xs bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full">
                                  manual
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-[#30363D]">
                    {!clinicId && (
                      <p className="text-xs text-amber-400 mb-2">
                        Tu usuario no está asociado a una clínica. Contacta al administrador.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                        placeholder="Escribe un mensaje manual... (pausa la IA por 5 min)"
                        disabled={!clinicId}
                        className="flex-1 rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#25D366] disabled:opacity-40"
                      />
                      <button
                        onClick={sendReply}
                        disabled={loading || !replyText.trim() || !clinicId}
                        className="rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#20bd5a] transition-colors disabled:opacity-40 flex items-center gap-2"
                      >
                        {loading ? (
                          <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                        ) : (
                          <span className="material-symbols-outlined text-lg">send</span>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Al enviar un mensaje manual, la IA se pausa automáticamente por 5 minutos.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-700 mb-4 block">chat</span>
                    <p className="text-slate-400 font-medium">Selecciona una conversación</p>
                    <p className="text-slate-600 text-sm mt-1">Los mensajes de WhatsApp aparecerán aquí</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
