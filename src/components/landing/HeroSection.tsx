"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

const CHAT = [
  { from: "patient", text: "Hola! Quiero agendar una consulta general" },
  { from: "bot", text: "¡Hola! Soy el asistente de Clínica San José 👋 Tenemos disponibilidad hoy a las 9:00 AM y 11:30 AM. ¿Cuál prefieres?" },
  { from: "patient", text: "Las 11:30 AM por favor" },
  { from: "bot", text: "✅ ¡Cita confirmada! Mañana a las 11:30 AM con la Dra. María González. ¿Tienes algún síntoma que quieras mencionar antes?" },
  { from: "patient", text: "Dolor de cabeza frecuente y fiebre baja" },
  { from: "bot", text: "Anotado 📋 La doctora estará preparada. Recibirás un recordatorio 2 horas antes. ¡Nos vemos!" },
];

export function HeroSection() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function clear() { timers.current.forEach(clearTimeout); timers.current = []; }

    function run() {
      clear();
      setVisibleCount(0);
      setShowTyping(false);

      const delays = [0, 1000, 1900, 2900, 3800, 4700];
      delays.forEach((delay, i) => {
        const isBot = CHAT[i]?.from === "bot";
        const t1 = setTimeout(() => {
          if (isBot) setShowTyping(true);
          const t2 = setTimeout(() => {
            setShowTyping(false);
            setVisibleCount(i + 1);
          }, isBot ? 700 : 0);
          timers.current.push(t2);
        }, delay);
        timers.current.push(t1);
      });

      const loop = setTimeout(run, 9000);
      timers.current.push(loop);
    }

    run();
    return clear;
  }, []);

  return (
    <section className="relative min-h-screen bg-[#051125] flex items-center overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />

      {/* Orbes */}
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)" }} />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-[0.08]"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />

      <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/25 rounded-full px-4 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-400 text-xs font-semibold tracking-wide uppercase">
                Bot IA médico 24/7 · Honduras & LATAM
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-white leading-[1.1] mb-6 tracking-tight">
              Tu clínica agenda
              <span className="block text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(90deg, #22d3ee, #67e8f9)" }}>
                sola por WhatsApp
              </span>
            </h1>

            <p className="text-lg text-white/55 leading-relaxed mb-8 max-w-lg">
              Un asistente de IA atiende a tus pacientes, agenda citas y registra síntomas —
              las 24 horas, sin que tú intervengas.
              Listo en <span className="text-white font-medium">menos de 5 minutos</span>.
            </p>

            <div className="flex flex-wrap gap-10 mb-10">
              {[
                { value: "24/7", label: "Bot activo" },
                { value: "10+", label: "Especialidades" },
                { value: "14 días", label: "Gratis" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-cyan-400">{s.value}</div>
                  <div className="text-xs text-white/35 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login"
                className="inline-flex items-center justify-center gap-2 bg-cyan-400 text-[#051125] font-bold px-6 py-3.5 rounded-xl hover:bg-white transition-all text-base shadow-xl shadow-cyan-400/20">
                Empezar gratis — 14 días
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-medium px-6 py-3.5 rounded-xl hover:bg-white/5 transition-all text-base">
                Ver cómo funciona
              </a>
            </div>
            <p className="text-xs text-white/25 mt-4">
              Sin tarjeta de crédito · Sin contrato · Cancela cuando quieras
            </p>
          </div>

          {/* WhatsApp mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-72 sm:w-80">
              <div className="bg-[#0d1929] border border-white/10 rounded-[2rem] p-2 shadow-2xl shadow-black/60">
                <div className="bg-[#111827] rounded-[1.6rem] overflow-hidden">

                  {/* WA header */}
                  <div className="bg-[#1a5c53] px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-xs font-bold text-cyan-300 shrink-0">
                      CS
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">Clínica San José</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <p className="text-white/60 text-xs">Bot IA activo</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-white/50 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>

                  {/* Messages */}
                  <div className="bg-[#0b141a] px-3 py-4 h-80 overflow-hidden flex flex-col gap-2">
                    <div className="text-center mb-1">
                      <span className="text-[10px] text-white/25 bg-white/5 px-3 py-0.5 rounded-full">Hoy</span>
                    </div>

                    {CHAT.slice(0, visibleCount).map((msg, i) => (
                      <div key={i}
                        className={`flex ${msg.from === "patient" ? "justify-end" : "justify-start"}`}
                        style={{ animation: "fadeUp 0.25s ease-out" }}>
                        <div className={`max-w-[84%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          msg.from === "patient"
                            ? "bg-[#005c4b] text-white rounded-tr-sm"
                            : "bg-[#202c33] text-white/90 rounded-tl-sm"
                        }`}>
                          {msg.from === "bot" && (
                            <p className="text-cyan-400 text-[9px] font-bold mb-0.5 uppercase tracking-wide">Salus IA</p>
                          )}
                          {msg.text}
                          <span className="block text-right text-[9px] text-white/25 mt-0.5">
                            {new Date().toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    ))}

                    {showTyping && (
                      <div className="flex justify-start">
                        <div className="bg-[#202c33] rounded-xl rounded-tl-sm px-4 py-2.5 flex gap-1 items-center">
                          {[0, 1, 2].map((i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/35 animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input bar */}
                  <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
                    <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-xs text-white/25">
                      Escribe un mensaje...
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges flotantes */}
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 animate-bounce">
                Cita agendada ✓
              </div>
              <div className="absolute -bottom-4 -left-2 bg-[#0d1929] border border-cyan-400/30 text-cyan-400 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                IA respondió en 1 seg
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" fill="white">
          <path d="M0,60 C480,0 960,0 1440,60 L1440,60 L0,60 Z" />
        </svg>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
