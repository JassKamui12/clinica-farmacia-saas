'use client';

import { useState, useCallback } from "react";

interface Prescription {
  id: string; productName: string; dosage: string | null; instructions: string | null;
  notes: string | null; whatsappSent: boolean; billingStatus: string; totalPrice: number;
  quantity: number; createdAt: string;
  patient: { id: string; name: string; whatsappPhone: string | null };
  doctor: { name: string | null; email: string };
}

const billingConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:   { label: "Pendiente", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  PREPARED:  { label: "Preparada", color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  BILLED:    { label: "Facturada", color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200" },
  DELIVERED: { label: "Entregada", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  CANCELLED: { label: "Cancelada", color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
};

export default function PrescriptionManager({ initialPrescriptions }: { initialPrescriptions: Prescription[] }) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch(filterStatus === "all" ? "/api/prescriptions" : `/api/prescriptions?status=${filterStatus}`);
    if (res.ok) setPrescriptions(await res.json());
  }, [filterStatus]);

  async function updateStatus(id: string, newStatus: string) {
    setLoading(true);
    const res = await fetch("/api/prescriptions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, billingStatus: newStatus }) });
    if (res.ok) {
      setMessage(`Estado: ${billingConfig[newStatus]?.label ?? newStatus}`);
      setPrescriptions((prev) => prev.map((rx) => rx.id === id ? { ...rx, billingStatus: newStatus } : rx));
      setTimeout(() => setMessage(""), 3000);
    }
    setLoading(false);
  }

  async function notifyPatient(rx: Prescription) {
    if (!rx.patient.whatsappPhone) { setMessage("Paciente sin WhatsApp registrado"); return; }
    setLoading(true);
    const res = await fetch("/api/whatsapp/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: rx.patient.whatsappPhone,
        body: `Hola ${rx.patient.name}, tu receta está lista:\n\n💊 ${rx.productName}\n📋 ${rx.dosage ?? ""}\n💰 Total: L ${rx.totalPrice.toFixed(2)}\n👨‍⚕️ Dr/Dra. ${rx.doctor.name ?? rx.doctor.email}`,
        patientId: rx.patient.id,
      }),
    });
    if (res.ok) { setMessage("Notificación enviada por WhatsApp"); setTimeout(() => setMessage(""), 3000); }
    setLoading(false);
  }

  const filtered = filterStatus === "all" ? prescriptions : prescriptions.filter((rx) => rx.billingStatus === filterStatus);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Recetas Pendientes</h2>
        <span className="text-xs text-slate-500">{filtered.length} receta{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">{message}</div>}

      <div className="flex flex-wrap gap-2">
        {(["all", "PENDING", "PREPARED"] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600"}`}>
            {s === "all" ? "Activas" : billingConfig[s].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">prescriptions</span>
          <p className="text-slate-500 font-medium">No hay recetas activas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rx) => {
            const billing = billingConfig[rx.billingStatus] ?? billingConfig.PENDING;
            return (
              <div key={rx.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${billing.bg} border ${billing.border} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${billing.color}`}>medication</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{rx.patient.name}</p>
                      <p className="text-sm text-slate-500">{rx.productName} · {rx.dosage ?? "Sin dosis"}</p>
                      <p className="text-xs text-slate-400 mt-1">Dr. {rx.doctor.name ?? rx.doctor.email} · {new Date(rx.createdAt).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">L {rx.totalPrice.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{rx.quantity} unidad{rx.quantity > 1 ? "es" : ""}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${billing.bg} ${billing.border} ${billing.color}`}>{billing.label}</span>

                    {rx.billingStatus === "PENDING" && (
                      <div className="flex gap-1">
                        <button onClick={() => updateStatus(rx.id, "PREPARED")} disabled={loading}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50" title="Marcar como preparada">
                          <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                        <button onClick={() => updateStatus(rx.id, "CANCELLED")} disabled={loading}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50" title="Cancelar">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    )}

                    {rx.billingStatus === "PREPARED" && (
                      <div className="flex gap-1">
                        <button onClick={() => updateStatus(rx.id, "BILLED")} disabled={loading}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors disabled:opacity-50">
                          Facturar
                        </button>
                        {rx.patient.whatsappPhone && (
                          <button onClick={() => notifyPatient(rx)} disabled={loading}
                            className="rounded-lg p-2 text-[#25D366] hover:bg-emerald-50 transition-colors disabled:opacity-50" title="Notificar por WhatsApp">
                            <span className="material-symbols-outlined text-lg">send</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {rx.instructions && <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">{rx.instructions}</p>}
                {rx.notes && <p className="text-xs text-slate-400 mt-1">{rx.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
