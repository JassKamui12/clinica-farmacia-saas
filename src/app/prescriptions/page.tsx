'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";
type BillingStatus = "PENDING" | "PREPARED" | "BILLED" | "DELIVERED" | "CANCELLED";

interface Prescription {
  id: string; productName: string; dosage?: string | null; instructions?: string | null;
  notes?: string | null; quantity: number; totalPrice: number; billingStatus: BillingStatus;
  whatsappSent: boolean; createdAt: string;
  patient: { id: string; name: string };
  doctor: { id: string; name?: string | null; email: string };
}

const statusConfig: Record<BillingStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  PENDING:   { label: "Pendiente",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: "pending" },
  PREPARED:  { label: "Preparada",  color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: "inventory" },
  BILLED:    { label: "Facturada",  color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200",  icon: "receipt_long" },
  DELIVERED: { label: "Entregada",  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: "check_circle" },
  CANCELLED: { label: "Cancelada",  color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: "cancel" },
};

const statusFlow: Record<BillingStatus, BillingStatus | null> = {
  PENDING: "PREPARED", PREPARED: "BILLED", BILLED: "DELIVERED", DELIVERED: null, CANCELLED: null,
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
    return rx.patient.name.toLowerCase().includes(filter.toLowerCase()) ||
      rx.productName.toLowerCase().includes(filter.toLowerCase()) ||
      (rx.doctor.name || "").toLowerCase().includes(filter.toLowerCase());
  });

  const pendingCount  = prescriptions.filter((p) => p.billingStatus === "PENDING").length;
  const preparedCount = prescriptions.filter((p) => p.billingStatus === "PREPARED").length;
  const billedCount   = prescriptions.filter((p) => p.billingStatus === "BILLED").length;
  const totalRevenue  = prescriptions.reduce((sum, p) => sum + (p.billingStatus !== "CANCELLED" ? p.totalPrice : 0), 0);

  if (status === "loading") return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  async function advanceStatus(id: string, currentStatus: BillingStatus) {
    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus) return;
    const res = await fetch("/api/prescriptions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, billingStatus: nextStatus }) });
    if (res.ok) { setMessage(`Estado: ${statusConfig[nextStatus].label}`); loadData(); setTimeout(() => setMessage(""), 3000); }
  }

  async function cancelPrescription(id: string) {
    const res = await fetch("/api/prescriptions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, billingStatus: "CANCELLED" }) });
    if (res.ok) { setMessage("Receta cancelada"); loadData(); setTimeout(() => setMessage(""), 3000); }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/prescriptions" userRole={(session?.user.role ?? "ADMIN") as AppRole} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Recetas</h1>
              <p className="text-slate-500 text-sm mt-1">Pipeline de facturación de recetas médicas</p>
            </div>
            <Link href="/consultations" className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
              <span className="material-symbols-outlined text-lg">add</span>
              Nueva Receta
            </Link>
          </div>

          {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">{message}</div>}

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{prescriptions.length}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pendientes</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{pendingCount}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Preparadas</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{preparedCount}</p>
            </div>
            <div className="bg-violet-50 rounded-2xl border border-violet-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Facturadas</p>
              <p className="text-3xl font-bold text-violet-600 mt-2">{billedCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ingresos</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">L {totalRevenue.toFixed(0)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar por paciente, producto o doctor..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "PENDING", "PREPARED", "BILLED", "DELIVERED", "CANCELLED"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${filterStatus === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {s === "all" ? "Todas" : statusConfig[s as BillingStatus]?.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">medication</span>
              <p className="text-slate-500 font-medium">No se encontraron recetas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((rx) => {
                const st = statusConfig[rx.billingStatus];
                const nextStatus = statusFlow[rx.billingStatus];
                const dateStr = new Date(rx.createdAt).toLocaleDateString("es-ES", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <div key={rx.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${st.bg} border ${st.border} flex items-center justify-center`}>
                          <span className={`material-symbols-outlined ${st.color}`}>{st.icon}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{rx.patient.name}</p>
                          <p className="text-sm text-slate-500">{rx.doctor.name || rx.doctor.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 flex-wrap">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-slate-500">Producto</p>
                            <p className="text-sm font-medium text-slate-800">{rx.productName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Cantidad</p>
                            <p className="text-sm font-medium text-slate-800">{rx.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Total</p>
                            <p className="text-sm font-bold text-blue-600">L {rx.totalPrice.toFixed(2)}</p>
                          </div>
                        </div>

                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${st.bg} ${st.border} ${st.color}`}>{st.label}</span>

                        <div className="flex items-center gap-1">
                          {rx.whatsappSent && <span className="material-symbols-outlined text-xs text-[#25D366]" title="Notificado por WhatsApp">notifications</span>}
                          <span className="text-xs text-slate-400">{dateStr}</span>
                        </div>

                        <div className="flex gap-1">
                          {nextStatus && (
                            <button onClick={() => advanceStatus(rx.id, rx.billingStatus)}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                              {nextStatus === "PREPARED" ? "Preparar" : nextStatus === "BILLED" ? "Facturar" : "Entregar"}
                            </button>
                          )}
                          {rx.billingStatus !== "CANCELLED" && rx.billingStatus !== "DELIVERED" && (
                            <button onClick={() => cancelPrescription(rx.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors" title="Cancelar">
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {(rx.dosage || rx.instructions || rx.notes) && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 grid gap-2 sm:grid-cols-3 mt-4">
                        {rx.dosage && <div><p className="text-xs text-slate-500">Dosis</p><p className="text-sm text-slate-800">{rx.dosage}</p></div>}
                        {rx.instructions && <div><p className="text-xs text-slate-500">Instrucciones</p><p className="text-sm text-slate-800">{rx.instructions}</p></div>}
                        {rx.notes && <div><p className="text-xs text-slate-500">Notas</p><p className="text-sm text-slate-800">{rx.notes}</p></div>}
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
