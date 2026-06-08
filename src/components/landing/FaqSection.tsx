"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Necesito saber de tecnología para usar Salus IA?",
    a: "No. Si sabes usar WhatsApp y puedes llenar un formulario, puedes usar Salus IA. El registro toma menos de 5 minutos y no necesitas instalar nada en tu computadora o teléfono.",
  },
  {
    q: "¿Los pacientes saben que hablan con una IA?",
    a: "El bot responde de forma natural y profesional con el nombre que tú le pongas. Si un paciente pregunta directamente si es una IA, el bot lo confirma con honestidad.",
  },
  {
    q: "¿Puedo usar mi número de WhatsApp actual?",
    a: "Sí. Solo escaneás un QR con tu teléfono. El bot usa tu número de siempre. Tus pacientes no necesitan hacer nada diferente.",
  },
  {
    q: "¿Qué pasa si necesito atender personalmente a un paciente?",
    a: "Escribe desde el panel y el bot se pausa automáticamente. Tú atiendes directamente. Cuando dejas de responder por 5 minutos, el bot retoma la conversación.",
  },
  {
    q: "¿Puedo tener varios doctores con horarios distintos?",
    a: "Sí. En los planes Clínica y Pro puedes agregar múltiples doctores, cada uno con sus horarios. El bot asigna citas al doctor disponible.",
  },
  {
    q: "¿Los datos de mis pacientes están seguros?",
    a: "Sí. Tus datos se almacenan en servidores cifrados (Supabase/PostgreSQL). Solo tú y tu equipo tienen acceso. No compartimos información con terceros.",
  },
  {
    q: "¿Qué pasa si un paciente tiene una emergencia médica?",
    a: "El bot detecta palabras de urgencia y dirige al paciente al número de emergencias que configures (911, tu celular directo). Nunca reemplaza la atención de emergencias.",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí. Sin contratos ni penalizaciones. Si decides no renovar, simplemente no lo haces. Tus datos se mantienen disponibles por 30 días para que puedas exportarlos.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        <div className="grid lg:grid-cols-[1fr,2fr] gap-16 items-start">

          {/* Left sticky */}
          <div className="lg:sticky lg:top-28">
            <span className="inline-block text-xs font-bold text-[#0d9488] bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-wide mb-5">
              FAQ
            </span>
            <h2 className="text-4xl font-black text-[#051125] tracking-tight leading-[1.1] mb-5">
              Preguntas<br />frecuentes.
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              ¿No encuentras tu respuesta? Escríbenos directamente.
            </p>
            <a href="mailto:hola@salus-ia.com"
              className="inline-flex items-center gap-2 border-2 border-[#051125] text-[#051125] font-bold px-5 py-3 rounded-2xl hover:bg-[#051125] hover:text-white transition-all text-sm">
              <span className="material-symbols-outlined text-[18px]">mail</span>
              hola@salus-ia.com
            </a>
          </div>

          {/* Accordion */}
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  open === i ? "border-teal-200 bg-teal-50/50" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                }`}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                  aria-expanded={open === i}>
                  <span className={`font-semibold text-sm transition-colors ${open === i ? "text-[#0d9488]" : "text-slate-800"}`}>
                    {faq.q}
                  </span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    open === i ? "border-teal-500 bg-teal-500" : "border-slate-300"
                  }`}>
                    <span className={`material-symbols-outlined text-[14px] transition-transform ${
                      open === i ? "text-white rotate-45" : "text-slate-400"
                    }`}>add</span>
                  </div>
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
      </div>
    </section>
  );
}
