'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

interface WhatsAppMessage {
  id: string;
  phone: string;
  direction: "INBOUND" | "OUTBOUND";
  body?: string | null;
  messageType: string;
  status: string;
  intent?: string | null;
  sessionData?: string | null;
  createdAt: string;
  patient?: { name: string; whatsappPhone?: string | null } | null;
}

interface Patient {
  id: string;
  name: string;
  whatsappPhone?: string | null;
}

export default function WhatsAppPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [conversation, setConversation] = useState<WhatsAppMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  const loadData = useCallback(async () => {
    const [msgsRes, patientsRes] = await Promise.all([
      fetch("/api/whatsapp/messages?limit=100"),
      fetch("/api/patients"),
    ]);
    const msgs = await msgsRes.json();
    setMessages(Array.isArray(msgs) ? msgs : []);
    setPatients(await patientsRes.json());

    const phones = [...new Set(msgs.map((m: WhatsAppMessage) => m.phone))] as string[];
    if (phones.length && !selectedPhone) {
      setSelectedPhone(phones[0]);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { loadData(); }
  }, [status, loadData]);

  useEffect(() => {
    if (selectedPhone) {
      fetch(`/api/whatsapp/messages?phone=${selectedPhone}&limit=100`)
        .then((res) => res.json())
        .then((data) => setConversation(data));
    }
  }, [selectedPhone]);

  async function sendReply() {
    if (!replyMessage.trim() || !selectedPhone) return;
    setLoading(true);
    const patient = patients.find((p) => p.whatsappPhone === selectedPhone);
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: selectedPhone,
        body: replyMessage,
        patientId: patient?.id,
      }),
    });
    if (res.ok) {
      setMessage("✅ Mensaje enviado");
      setReplyMessage("");
      fetch(`/api/whatsapp/messages?phone=${selectedPhone}&limit=100`)
        .then((res) => res.json())
        .then((data) => setConversation(data));
    }
    setLoading(false);
  }

  const phoneGroups = Array.isArray(messages) ? messages.reduce((acc: Record<string, { phone: string; lastMessage: WhatsAppMessage; patient?: Patient }>, msg) => {
    if (!acc[msg.phone]) {
      const patient = patients.find((p) => p.whatsappPhone === msg.phone);
      acc[msg.phone] = { phone: msg.phone, lastMessage: msg, patient };
    }
    if (new Date(msg.createdAt) > new Date(acc[msg.phone].lastMessage.createdAt)) {
      acc[msg.phone].lastMessage = msg;
    }
    return acc;
  }, {}) : {};

  const phoneList = Object.values(phoneGroups).sort((a, b) =>
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );

  if (status === "loading") return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/whatsapp" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">WhatsApp - Conversaciones</h1>
            <p className="text-slate-500 mt-1">Gestiona las conversaciones con pacientes y la IA</p>
          </div>

          {message && <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-4 text-[#00F5A0] text-sm">{message}</div>}

          <div className="grid gap-6 xl:grid-cols-3" style={{ height: "calc(100vh - 200px)" }}>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#30363D]">
                <input
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Buscar por teléfono..."
                  className="w-full rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2 text-sm text-slate-200 outline-none focus:border-[#25D366]"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {phoneList
                  .filter((p) => p.phone.includes(searchPhone))
                  .map((group) => (
                    <button
                      key={group.phone}
                      onClick={() => setSelectedPhone(group.phone)}
                      className={`w-full text-left p-4 border-b border-[#30363D] hover:bg-[#0A0C10] transition-colors ${
                        selectedPhone === group.phone ? "bg-[#0A0C10] border-l-4 border-l-[#25D366]" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-100 text-sm">{group.patient?.name || group.phone}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">{group.lastMessage.body || "Sin mensaje"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600">{new Date(group.lastMessage.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
                          <span className={`text-xs ${group.lastMessage.direction === "INBOUND" ? "text-[#25D366]" : "text-[#00D9FF]"}`}>
                            {group.lastMessage.direction === "INBOUND" ? "↓" : "↑"}
                          </span>
                        </div>
                      </div>
                      {group.lastMessage.intent && (
                        <span className="text-xs bg-[#25D366]/10 text-[#25D366] px-2 py-0.5 rounded-full mt-1 inline-block">
                          {group.lastMessage.intent}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            <div className="xl:col-span-2 rounded-2xl border border-[#30363D] bg-[#161B22] flex flex-col overflow-hidden">
              {selectedPhone ? (
                <>
                  <div className="p-4 border-b border-[#30363D] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-100">{selectedPhone}</p>
                      <p className="text-xs text-slate-500">
                        {phoneList.find((p) => p.phone === selectedPhone)?.patient?.name || "Paciente no registrado"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${process.env.WHATSAPP_ACCESS_TOKEN ? "bg-[#25D366]" : "bg-amber-400"}`}></span>
                      <span className="text-xs text-slate-400">WhatsApp</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {conversation.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">Sin mensajes</p>
                    ) : (
                      conversation.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                              msg.direction === "OUTBOUND"
                                ? "bg-[#25D366]/10 border border-[#25D366]/20"
                                : "bg-[#0A0C10] border border-[#30363D]"
                            }`}
                          >
                            <p className="text-sm text-slate-200 whitespace-pre-line">{msg.body}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-slate-600">{new Date(msg.createdAt).toLocaleString("es-ES")}</p>
                              {msg.intent && (
                                <span className="text-xs bg-[#25D366]/10 text-[#25D366] px-2 py-0.5 rounded-full">
                                  {msg.intent}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 border-t border-[#30363D]">
                    <div className="flex gap-2">
                      <input
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendReply()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 rounded-xl border border-[#30363D] bg-[#0A0C10] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-[#25D366]"
                      />
                      <button
                        onClick={sendReply}
                        disabled={loading || !replyMessage.trim()}
                        className="rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#20bd5a] transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">send</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">chat</span>
                    <p className="text-slate-400">Selecciona una conversación</p>
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
