"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const APPOINTMENTS = [
  { name: "María López",    time: "09:00",  type: "Consulta general",  status: "Confirmada" },
  { name: "Carlos Reyes",   time: "10:30",  type: "Control de presión", status: "Pendiente" },
  { name: "Ana Martínez",   time: "11:00",  type: "Pediatría",          status: "Confirmada" },
];

const CHAT = [
  { from: "patient", text: "Buenas, quiero una cita para mañana" },
  { from: "bot",     text: "¡Hola! Tengo disponible mañana a las 9:00 AM o 11:30 AM. ¿Cuál prefieres?" },
  { from: "patient", text: "Las 9 AM perfecto" },
  { from: "bot",     text: "✓ Cita confirmada para mañana 9:00 AM con la Dra. González." },
];

function AppointmentCard() {
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-5 w-72">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Hoy</p>
          <p className="font-bold text-slate-900 text-sm">
            {new Date().toLocaleDateString("es-HN", { weekday: "long", day: "numeric", month: "short" })}
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-teal-600 text-[18px]">calendar_month</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {APPOINTMENTS.map((a, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{a.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 text-xs font-semibold truncate">{a.name}</p>
              <p className="text-slate-400 text-[10px]">{a.time} · {a.type}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              a.status === "Confirmada"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}>{a.status}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">3 citas hoy</span>
        <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Bot activo
        </div>
      </div>
    </div>
  );
}

function ChatCard() {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let idx = 0;
    function next() {
      if (idx >= CHAT.length) { setTimeout(() => { setVisible(0); setTyping(false); idx = 0; next(); }, 2500); return; }
      const isBot = CHAT[idx]?.from === "bot";
      if (isBot) { setTyping(true); setTimeout(() => { setTyping(false); setVisible(idx + 1); idx++; setTimeout(next, 1000); }, 600); }
      else { setVisible(idx + 1); idx++; setTimeout(next, 800); }
    }
    const t = setTimeout(next, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 w-64 overflow-hidden">
      <div className="bg-[#075e54] px-4 py-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-teal-400/20 border border-teal-400/30 flex items-center justify-center text-[10px] font-bold text-teal-200">S</div>
        <div>
          <p className="text-white text-xs font-semibold">Salus IA · Clínica</p>
          <p className="text-white/50 text-[9px]">en línea</p>
        </div>
      </div>
      <div className="bg-[#0b141a] px-3 py-3 h-44 flex flex-col gap-1.5 overflow-hidden">
        {CHAT.slice(0, visible).map((m, i) => (
          <div key={i} className={`flex ${m.from === "patient" ? "justify-end" : "justify-start"}`}
            style={{ animation: "fadeUp 0.2s ease-out" }}>
            <div className={`max-w-[85%] px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed ${
              m.from === "patient" ? "bg-[#005c4b] text-white rounded-tr-sm" : "bg-[#202c33] text-white/90 rounded-tl-sm"
            }`}>
              {m.from === "bot" && <p className="text-teal-400 text-[8px] font-bold mb-0.5">SALUS IA</p>}
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-[#202c33] rounded-lg rounded-tl-sm px-3 py-2 flex gap-1">
              {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-white flex items-center overflow-hidden pt-16">
      {/* Blobs de fondo */}
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 20%, rgba(13,148,136,0.08) 0%, transparent 65%)" }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 20% 80%, rgba(5,17,37,0.05) 0%, transparent 65%)" }} />

      <div className="relative max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Copy */}
          <div className="animate-fade-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-teal-200 bg-teal-50 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-teal-700 text-xs font-semibold">Gestión clínica inteligente · Honduras & LATAM</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-black text-[#051125] leading-[1.05] tracking-tight mb-6">
              Tu clínica,<br />
              <span className="relative">
                <span className="relative z-10 text-[#0d9488]">siempre atenta.</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                  <path d="M0 8 Q75 2 150 8 Q225 14 300 8" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
                </svg>
              </span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-md">
              Tus pacientes escriben por WhatsApp y el bot IA agenda, registra síntomas y manda recordatorios solo. Tú te enfocas en atenderlos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/login"
                className="inline-flex items-center justify-center gap-2 bg-[#051125] text-white font-bold px-7 py-4 rounded-2xl hover:bg-[#1b263b] transition-all text-base shadow-lg shadow-[#051125]/20 hover:shadow-xl hover:shadow-[#051125]/25 hover:-translate-y-0.5">
                Crear mi clínica gratis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-medium px-7 py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all text-base">
                Ver cómo funciona
              </a>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="material-symbols-outlined text-[14px]">check</span> Sin tarjeta de crédito
              <span className="mx-2 text-slate-200">·</span>
              <span className="material-symbols-outlined text-[14px]">check</span> 14 días gratis
              <span className="mx-2 text-slate-200">·</span>
              <span className="material-symbols-outlined text-[14px]">check</span> Cancela cuando quieras
            </div>
          </div>

          {/* Cards flotantes */}
          <div className="relative h-[480px] hidden lg:block">
            {/* Card agenda — centro */}
            <div className="absolute top-8 right-8 animate-float" style={{ animationDelay: "0s" }}>
              <AppointmentCard />
            </div>
            {/* Card chat — abajo izquierda */}
            <div className="absolute bottom-4 left-0 animate-float" style={{ animationDelay: "2s" }}>
              <ChatCard />
            </div>
            {/* Badge flotante — arriba izquierda */}
            <div className="absolute top-16 left-4 bg-white rounded-2xl shadow-lg shadow-slate-200/80 border border-slate-100 px-4 py-3 animate-float" style={{ animationDelay: "1s" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">trending_up</span>
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-sm">+38%</p>
                  <p className="text-slate-400 text-[10px]">menos inasistencias</p>
                </div>
              </div>
            </div>
            {/* Badge respuesta */}
            <div className="absolute bottom-52 left-56 bg-[#051125] rounded-2xl shadow-lg px-4 py-2.5 animate-float" style={{ animationDelay: "3s" }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <p className="text-white text-xs font-semibold">Bot respondió en 1 seg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 rounded-2xl overflow-hidden">
          {[
            { value: "24/7",  label: "Bot siempre activo" },
            { value: "10+",   label: "Especialidades médicas" },
            { value: "< 5m",  label: "Para configurar" },
            { value: "14d",   label: "Prueba gratuita" },
          ].map((s) => (
            <div key={s.label} className="bg-white px-6 py-5 text-center hover:bg-slate-50 transition-colors">
              <p className="text-2xl font-black text-[#051125]">{s.value}</p>
              <p className="text-slate-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
