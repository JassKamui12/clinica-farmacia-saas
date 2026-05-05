'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

type BillingStatus = "PENDING" | "PREPARED" | "BILLED" | "DELIVERED" | "CANCELLED";

interface Prescription {
  id: string;
  productName: string;
  dosage?: string | null;
  instructions?: string | null;
  notes?: string | null;
  quantity: number;
  totalPrice: number;
  billingStatus: BillingStatus;
  whatsappSent: boolean;
  createdAt: string;
  patient: { id: string; name: string };
  doctor: { id: string; name?: string | null; email: string };
}

const statusConfig: Record<BillingStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING: { label: "Pendiente", color: "text-amber-400", bg: "bg-amber-400/10", icon: "pending" },
  PREPARED: { label: "Preparada", color: "text-[#00D9FF]", bg: "bg-[#00D9FF]/10", icon: "inventory" },
  BILLED: { label: "Facturada", color: "text-blue-400", bg: "bg-blue-400/10", icon: "receipt_long" },
  DELIVERED: { label: "Entregada", color: "text-[#00F5A0]", bg: "bg-[#00F5A0]/10", icon: "check_circle" },
  CANCELLED: { label: "Cancelada", color: "text-red-400", bg: "bg-red-400/10", icon: "cancel" },
};

const statusFlow: Record<BillingStatus, BillingStatus | null> = {
  PENDING: "PREPARED",
  PREPARED: "BILLED",
  BILLED: "DELIVERED",
  DELIVERED: null,
  CANCELLED: null,
};

export default function PrescriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filter, setFilter] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const url = filterStatus === "all" ? "/api/prescriptions" : `/api/prescriptions?status=${filterStatus}`;
    const res = await fetch(url);
    setPrescriptions(await res.json());
  }, [filterStatus]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { loadData(); }
  }, [status, loadData]);

  const filtered = prescriptions.filter((rx) => {
    if (!filter) return true;
    return (
      rx.patient.name.toLowerCase().includes(filter.toLowerCase()) ||
      rx.productName.toLowerCase().includes(filter.toLowerCase()) ||
      (rx.doctor.name || "").toLowerCase().includes(filter.toLowerCase())
    );
  });

  const pendingCount = prescriptions.filter((p) => p.billingStatus === "PENDING").length;
  const preparedCount = prescriptions.filter((p) => p.billingStatus === "PREPARED").length;
  const billedCount = prescriptions.filter((p) => p.billingStatus === "BILLED").length;
  const totalRevenue = prescriptions.reduce((sum, p) => sum + (p.billingStatus !== "CANCELLED" ? p.totalPrice : 0), 0);

  if (status === "loading") return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  async function advanceStatus(id: string, currentStatus: BillingStatus) {
    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus) return;

    const res = await fetch("/api/prescriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, billingStatus: nextStatus }),
    });

    if (res.ok) {
      setMessage(`Estado actualizado a ${statusConfig[nextStatus].label}`);
      loadData();
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function cancelPrescription(id: string) {
    const res = await fetch("/api/prescriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, billingStatus: "CANCELLED" }),
    });

    if (res.ok) {
      setMessage("Receta cancelada");
      loadData();
      setTimeout(() => setMessage(""), 3000);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/prescriptions" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Recetas</h1>
              <p className="text-slate-500 mt-1">Pipeline de facturación de recetas médicas</p>
            </div>
            <Link href="/consultations" className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] px-5 py-2.5 text-sm font-bold text-[#0A0C10] shadow-[0_20px_45px_-20px_rgba(0,245,160,0.7)] hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-lg">add</span>
              Nueva Receta
            </Link>
          </div>

          {message && (
            <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-4 text-[#00F5A0] text-sm">
              {message}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Total</p>
              <p className="text-3xl font-bold text-slate-100 mt-2">{prescriptions.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Pendientes</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-[#00D9FF]/30 bg-[#00D9FF]/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Preparadas</p>
              <p className="text-3xl font-bold text-[#00D9FF] mt-2">{preparedCount}</p>
            </div>
            <div className="rounded-2xl border border-blue-400/30 bg-blue-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Facturadas</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{billedCount}</p>
            </div>
            <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Ingresos</p>
              <p className="text-3xl font-bold text-[#00F5A0] mt-2">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar por paciente, producto o doctor..."
              className="flex-1 rounded-2xl border border-[#30363D] bg-[#161B22] px-5 py-3 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
            />
            <div className="flex gap-2">
              {["all", "PENDING", "PREPARED", "BILLED", "DELIVERED", "CANCELLED"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    filterStatus === s
                      ? "bg-[#00F5A0] text-[#0A0C10]"
                      : "border border-[#30363D] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {s === "all" ? "Todas" : statusConfig[s as BillingStatus]?.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">medication</span>
              <p className="text-slate-500">No se encontraron recetas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((rx) => {
                const status = statusConfig[rx.billingStatus];
                const nextStatus = statusFlow[rx.billingStatus];
                const dateObj = new Date(rx.createdAt);
                const dateStr = dateObj.toLocaleDateString("es-ES", { weekday: "short", month: "short", day: "numeric" });

                return (
                  <div key={rx.id} className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 hover:border-[#30363D]/80 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${status.bg} flex items-center justify-center`}>
                          <span className={`material-symbols-outlined ${status.color}`}>{status.icon}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{rx.patient.name}</p>
                          <p className="text-sm text-slate-500">{rx.doctor.name || rx.doctor.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-slate-500">Producto</p>
                            <p className="text-sm font-medium text-slate-200">{rx.productName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Cantidad</p>
                            <p className="text-sm font-medium text-slate-200">{rx.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Total</p>
                            <p className="text-sm font-bold text-[#00F5A0]">${rx.totalPrice.toFixed(2)}</p>
                          </div>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>

                        <div className="flex items-center gap-1">
                          {rx.whatsappSent && (
                            <span className="material-symbols-outlined text-xs text-[#25D366]" title="Notificado por WhatsApp">notifications</span>
                          )}
                          <span className="text-xs text-slate-600">{dateStr}</span>
                        </div>

                        <div className="flex gap-1">
                          {nextStatus && (
                            <button
                              onClick={() => advanceStatus(rx.id, rx.billingStatus)}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[#00F5A0]/10 text-[#00F5A0] hover:bg-[#00F5A0]/20 transition-colors"
                            >
                              {nextStatus === "PREPARED" ? "Preparar" : nextStatus === "BILLED" ? "Facturar" : "Entregar"}
                            </button>
                          )}
                          {rx.billingStatus !== "CANCELLED" && rx.billingStatus !== "DELIVERED" && (
                            <button
                              onClick={() => cancelPrescription(rx.id)}
                              className="rounded-lg p-2 text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Cancelar"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {(rx.dosage || rx.instructions || rx.notes) && (
                      <div className="rounded-xl bg-[#0A0C10] p-4 grid gap-2 sm:grid-cols-3 mt-4">
                        {rx.dosage && (
                          <div>
                            <p className="text-xs text-slate-500">Dosis</p>
                            <p className="text-sm text-slate-200">{rx.dosage}</p>
                          </div>
                        )}
                        {rx.instructions && (
                          <div>
                            <p className="text-xs text-slate-500">Instrucciones</p>
                            <p className="text-sm text-slate-200">{rx.instructions}</p>
                          </div>
                        )}
                        {rx.notes && (
                          <div>
                            <p className="text-xs text-slate-500">Notas</p>
                            <p className="text-sm text-slate-200">{rx.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
