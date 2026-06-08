"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Necesito saber de tecnología para usar Salus IA?",
    a: "Para nada. Si sabes usar WhatsApp y puedes llenar un formulario, puedes usar Salus IA. El registro toma menos de 5 minutos y no necesitas instalar nada.",
  },
  {
    q: "¿Los pacientes sabrán que están hablando con una IA?",
    a: "El bot responde de forma natural y profesional. Puedes configurarle un nombre personalizado para tu clínica. Si un paciente pregunta directamente, la IA lo dice con honestidad.",
  },
  {
    q: "¿Qué pasa con los mensajes que ya me llegan por WhatsApp?",
    a: "Puedes conectar tu número actual de WhatsApp escaneando un QR. El bot responde automáticamente, pero tú puedes intervenir en cualquier momento — cuando tú escribas, el bot se pausa y tú atiendes directamente.",
  },
  {
    q: "¿Puedo tener varios doctores con diferentes horarios?",
    a: "Sí. Puedes agregar múltiples doctores, cada uno con sus horarios y especialidades. El bot asigna citas al doctor disponible según el tipo de consulta.",
  },
  {
    q: "¿El bot puede manejar emergencias médicas?",
    a: "El bot identifica mensajes de urgencia y tiene instrucciones para referir al 911 o al número de emergencia de tu clínica. Nunca reemplaza la atención de emergencias.",
  },
  {
    q: "¿Qué pasa si un paciente pregunta algo que el bot no sabe responder?",
    a: "El bot escala la conversación. Te llega una notificación y tú tomas el control para atender personalmente. La sesión queda en pausa 5 minutos mientras espera tu respuesta.",
  },
  {
    q: "¿Los datos de mis pacientes están seguros?",
    a: "Sí. Los datos se almacenan en servidores cifrados (Supabase/PostgreSQL). Solo tú y tu equipo tienen acceso. Cumplimos con estándares de seguridad de datos médicos.",
  },
  {
    q: "¿Cuánto cuesta después de las 2 semanas de prueba?",
    a: "El plan Básico empieza desde L 300/mes (~$12 USD). Puedes ver todos los planes en la sección de precios. El pago se hace por transferencia bancaria, tarjeta o el método disponible en tu país.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-[#051125] bg-slate-200 px-3 py-1 rounded-full mb-4 border border-slate-300">
            Preguntas frecuentes
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Resolvemos tus dudas
          </h2>
          <p className="text-slate-500">
            Si tienes otra pregunta, escríbenos al{" "}
            <a href="mailto:hola@salus-ia.com" className="text-cyan-600 hover:underline font-medium">
              hola@salus-ia.com
            </a>
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i}
              className={`rounded-2xl border transition-all ${
                open === i
                  ? "bg-white border-slate-300 shadow-md"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                aria-expanded={open === i}>
                <span className="font-semibold text-slate-900 text-sm">{faq.q}</span>
                <span className={`material-symbols-outlined text-slate-400 text-[20px] shrink-0 transition-transform ${
                  open === i ? "rotate-180" : ""
                }`}>expand_more</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
