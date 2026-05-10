'use client';

import { useState, useCallback } from "react";

interface Prescription {
  id: string;
  productName: string;
  dosage: string | null;
  instructions: string | null;
  notes: string | null;
  whatsappSent: boolean;
  billingStatus: string;
  totalPrice: number;
  quantity: number;
  createdAt: string;
  patient: { id: string; name: string; whatsappPhone: string | null };
  doctor: { name: string | null; email: string };
}

const billingLabels: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "Pendiente",  color: "text-amber-400",   bg: "bg-amber-400/10"   },
  PREPARED:  { label: "Preparada",  color: "text-[#00D9FF]",   bg: "bg-[#00D9FF]/10"   },
  BILLED:    { label: "Facturada",  color: "text-[#00F5A0]",   bg: "bg-[#00F5A0]/10"   },
  DELIVERED: { label: "Entregada",  color: "text-blue-400",    bg: "bg-blue-400/10"    },
  CANCELLED: { label: "Cancelada",  color: "text-red-400",     bg: "bg-red-400/10"     },
};

export default function PrescriptionManager({ initialPrescriptions }: { initialPrescriptions: Prescription[] }) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    const url = filterStatus === "all" ? "/api/prescriptions?status=PENDING,PREPARED" : `/api/prescriptions?status=${filterStatus}`;
    const res = await fetch(filterStatus === "all" ? "/api/prescriptions" : `/api/prescriptions?status=${filterStatus}`);
    if (res.ok) setPrescriptions(await res.json());
  }, [filterStatus]);

  async function updateStatus(id: string, newStatus: string) {
    setLoading(true);
    const res = await fetch("/api/prescriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, billingStatus: newStatus }),
    });
    if (res.ok) {
      setMessage(`Estado actualizado a: ${billingLabels[newStatus]?.label ?? newStatus}`);
      setPrescriptions((prev) =>
        prev.map((rx) => rx.id === id ? { ...rx, billingStatus: newStatus } : rx)
      );
      setTimeout(() => setMessage(""), 3000);
    }
    setLoading(false);
  }

  async function notifyPatient(rx: Prescription) {
    if (!rx.patient.whatsappPhone) { setMessage("Paciente sin WhatsApp registrado"); return; }
    setLoading(true);
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: rx.patient.whatsappPhone,
        body: `Hola ${rx.patient.name}, tu receta está lista:\n\n💊 ${rx.productName}\n📋 ${rx.dosage ?? ""}\n💰 Total: $${rx.totalPrice.toFixed(2)}\n👨‍⚕️ Dr/Dra. ${rx.doctor.name ?? rx.doctor.email}`,
        patientId: rx.patient.id,
      }),
    });
    if (res.ok) {
      setMessage("✅ Notificación enviada por WhatsApp");
      setTimeout(() => setMessage(""), 3000);
    }
    setLoading(false);
  }

  const filtered = filterStatus === "all"
    ? prescriptions
    : prescriptions.filter((rx) => rx.billingStatus === filterStatus);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Recetas Pendientes</h2>
        <span className="text-xs text-slate-500">{filtered.length} receta{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {message && (
        <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-3 text-[#00F5A0] text-sm">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "PENDING", "PREPARED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filterStatus === s
                ? "bg-[#00F5A0] text-[#0A0C10]"
                : "border border-[#30363D] text-slate-400 hover:text-slate-200"
            }`}
          >
            {s === "all" ? "Activas" : billingLabels[s].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">prescriptions</span>
          <p className="text-slate-400">No hay recetas activas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rx) => {
            const billing = billingLabels[rx.billingStatus] ?? billingLabels.PENDING;
            return (
              <div key={rx.id} className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${billing.bg} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${billing.color}`}>medication</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{rx.patient.name}</p>
                      <p className="text-sm text-slate-500">{rx.productName} · {rx.dosage ?? "Sin dosis"}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Dr. {rx.doctor.name ?? rx.doctor.email} · {new Date(rx.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-100">${rx.totalPrice.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{rx.quantity} unidad{rx.quantity > 1 ? "es" : ""}</p>
                    </div>

                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${billing.bg} ${billing.color}`}>
                      {billing.label}
                    </span>

                    {rx.billingStatus === "PENDING" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(rx.id, "PREPARED")}
                          disabled={loading}
                          className="rounded-lg p-2 text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-colors disabled:opacity-50"
                          title="Marcar como preparada"
                        >
                          <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                        <button
                          onClick={() => updateStatus(rx.id, "CANCELLED")}
                          disabled={loading}
                          className="rounded-lg p-2 text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                          title="Cancelar"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    )}

                    {rx.billingStatus === "PREPARED" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(rx.id, "BILLED")}
                          disabled={loading}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[#00F5A0]/10 text-[#00F5A0] hover:bg-[#00F5A0]/20 transition-colors disabled:opacity-50"
                        >
                          Facturar
                        </button>
                        {rx.patient.whatsappPhone && (
                          <button
                            onClick={() => notifyPatient(rx)}
                            disabled={loading}
                            className="rounded-lg p-2 text-[#25D366] hover:bg-[#25D366]/10 transition-colors disabled:opacity-50"
                            title="Notificar por WhatsApp"
                          >
                            <span className="material-symbols-outlined text-lg">send</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {rx.instructions && (
                  <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-[#30363D]">{rx.instructions}</p>
                )}
                {rx.notes && <p className="text-xs text-slate-500 mt-1">{rx.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
