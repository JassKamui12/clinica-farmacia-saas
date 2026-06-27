'use client';

import { useEffect, useState } from "react";

interface Campana {
  id: string;
  title: string;
  messageTemplate: string;
  audienceType: string;
  inactiveMonths: number;
  status: string;
  scheduledFor: string | null;
  sentCount: number;
  lastRunAt: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Borrador",   color: "bg-slate-100 text-slate-600" },
  SCHEDULED: { label: "Programada", color: "bg-amber-100 text-amber-700" },
  SENT:      { label: "Enviada",    color: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Cancelada",  color: "bg-red-100 text-red-600" },
};

// Plantillas de ejemplo: framing de CUIDADO, no de promoción.
const EXAMPLES = [
  { title: "Control anual de salud", text: "Hola {nombre} 👋 En tu clínica notamos que hace tiempo no te realizas un chequeo. Cuidar tu salud a tiempo previene complicaciones. ¿Agendamos tu control? Responde para coordinar el día." },
  { title: "Seguimiento de presión/glucosa", text: "Hola {nombre}, queremos saber cómo sigues con tu tratamiento. Es importante medir tu presión/glucosa regularmente. Escríbenos para programar tu siguiente control. Estamos para acompañarte. 🩺" },
  { title: "Reactivación de paciente", text: "Hola {nombre} 👋 Hace varios meses no te vemos por la clínica. Tu bienestar nos importa. Si tienes alguna molestia o quieres un chequeo preventivo, responde y te agendamos." },
];

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all";
const LABEL = "block text-xs font-semibold text-slate-600 mb-1.5";

interface FormState {
  title: string;
  messageTemplate: string;
  audienceType: string;
  inactiveMonths: string;
  scheduledFor: string;
}

const EMPTY_FORM: FormState = { title: "", messageTemplate: "", audienceType: "inactive", inactiveMonths: "6", scheduledFor: "" };

export default function CampanasPage() {
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/campanas")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setCampanas(d); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(c: Campana) {
    setEditingId(c.id);
    setForm({
      title: c.title,
      messageTemplate: c.messageTemplate,
      audienceType: c.audienceType,
      inactiveMonths: String(c.inactiveMonths),
      scheduledFor: c.scheduledFor ? c.scheduledFor.slice(0, 16) : "",
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.title.trim().length < 3) { setError("El título es muy corto."); return; }
    if (form.messageTemplate.trim().length < 10) { setError("El mensaje es muy corto."); return; }

    const payload = {
      title: form.title.trim(),
      messageTemplate: form.messageTemplate.trim(),
      audienceType: form.audienceType,
      inactiveMonths: parseInt(form.inactiveMonths || "6", 10),
      scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
    };

    setSaving(true);
    try {
      const url = editingId ? `/api/campanas/${editingId}` : "/api/campanas";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "No se pudo guardar.");
        return;
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleSend(c: Campana) {
    if (!confirm(`¿Enviar "${c.title}" ahora a los pacientes de la audiencia seleccionada?`)) return;
    setSendingId(c.id);
    try {
      const res = await fetch(`/api/campanas/${c.id}/send`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(`Enviada a ${d.sent} de ${d.audience} pacientes.`);
        load();
      } else {
        alert(d.error ?? "No se pudo enviar.");
      }
    } finally {
      setSendingId(null);
    }
  }

  async function handleDelete(c: Campana) {
    if (!confirm(`¿Eliminar la campaña "${c.title}"?`)) return;
    const res = await fetch(`/api/campanas/${c.id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campañas de salud</h1>
          <p className="text-slate-500 text-sm mt-1">
            Recordatorios de cuidado para que tus pacientes se atiendan a tiempo.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[#051125] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#1b263b] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva campaña
        </button>
      </div>

      <div className="flex items-start gap-2 text-xs text-slate-500 bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-2 mb-6">
        <span className="material-symbols-outlined text-[16px] text-blue-500 mt-0.5">info</span>
        <p>Enfoque de cuidado, no publicidad: el objetivo es que el paciente vuelva a tratarse. Evita lenguaje de ofertas o descuentos.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : campanas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3">volunteer_activism</span>
          <p className="font-medium text-slate-600">Sin campañas todavía</p>
          <p className="text-sm mt-1">Crea tu primera campaña de recordatorio de cuidado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campanas.map((c) => {
            const st = STATUS_LABELS[c.status] ?? STATUS_LABELS.DRAFT;
            return (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900 text-sm">{c.title}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{c.messageTemplate}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{c.audienceType === "inactive" ? `Inactivos > ${c.inactiveMonths} meses` : "Todos los pacientes"}</span>
                      {c.sentCount > 0 && <span>· Enviada a {c.sentCount}</span>}
                      {c.scheduledFor && <span>· Programada {new Date(c.scheduledFor).toLocaleString("es-HN")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleSend(c)}
                      disabled={sendingId === c.id}
                      className="flex items-center gap-1 text-xs font-semibold text-white bg-[#051125] hover:bg-[#1b263b] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      {sendingId === c.id ? "Enviando…" : "Enviar ahora"}
                    </button>
                    <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-blue-600 p-1.5">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => handleDelete(c)} className="text-slate-400 hover:text-red-600 p-1.5">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Editar campaña" : "Nueva campaña"}</h2>
              <button onClick={() => !saving && setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={LABEL}>Título</label>
                <input className={INPUT} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Control anual de salud" autoFocus />
              </div>

              <div>
                <label className={LABEL}>Mensaje (usa {"{nombre}"} para personalizar)</label>
                <textarea className={INPUT} rows={4} value={form.messageTemplate} onChange={(e) => setForm({ ...form, messageTemplate: e.target.value })} placeholder="Hola {nombre}, queremos cuidar tu salud…" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {EXAMPLES.map((ex) => (
                    <button key={ex.title} type="button" onClick={() => setForm({ ...form, title: form.title || ex.title, messageTemplate: ex.text })}
                      className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                      {ex.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Audiencia</label>
                  <select className={INPUT} value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value })}>
                    <option value="inactive">Pacientes inactivos</option>
                    <option value="all">Todos los pacientes</option>
                  </select>
                </div>
                {form.audienceType === "inactive" && (
                  <div>
                    <label className={LABEL}>Sin venir hace (meses)</label>
                    <input className={INPUT} type="number" min="1" max="60" value={form.inactiveMonths} onChange={(e) => setForm({ ...form, inactiveMonths: e.target.value })} />
                  </div>
                )}
              </div>

              <div>
                <label className={LABEL}>Programar envío (opcional)</label>
                <input className={INPUT} type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} />
                <p className="text-[11px] text-slate-400 mt-1">Si lo dejas vacío, queda como borrador y la envías manualmente con &quot;Enviar ahora&quot;.</p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#051125] text-white text-sm font-semibold hover:bg-[#1b263b] transition-colors disabled:opacity-50">
                  {saving ? "Guardando…" : editingId ? "Guardar" : "Crear campaña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
