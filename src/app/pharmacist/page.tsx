'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

interface Prescription {
  id: string;
  productName: string;
  dosage?: string | null;
  instructions?: string | null;
  notes?: string | null;
  whatsappSent: boolean;
  billingStatus: string;
  totalPrice: number;
  quantity: number;
  createdAt: string;
  patient: { id: string; name: string; whatsappPhone?: string | null };
  doctor: { name?: string | null; email: string };
}

interface Product {
  id: string;
  name: string;
  category?: string | null;
  price: number;
  stock: number;
  isAvailable: boolean;
}

const billingLabels: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "text-amber-400", bg: "bg-amber-400/10" },
  PREPARED: { label: "Preparada", color: "text-[#00D9FF]", bg: "bg-[#00D9FF]/10" },
  BILLED: { label: "Facturada", color: "text-[#00F5A0]", bg: "bg-[#00F5A0]/10" },
  DELIVERED: { label: "Entregada", color: "text-blue-400", bg: "bg-blue-400/10" },
  CANCELLED: { label: "Cancelada", color: "text-red-400", bg: "bg-red-400/10" },
};

export default function PharmacistDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  const loadData = useCallback(async () => {
    const url = filterStatus === "all" ? "/api/prescriptions" : `/api/prescriptions?status=${filterStatus}`;
    const [rxRes, prodRes] = await Promise.all([
      fetch(url),
      fetch("/api/products"),
    ]);
    setPrescriptions(await rxRes.json());
    setProducts(await prodRes.json());
  }, [filterStatus]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { loadData(); }
  }, [status, loadData]);

  async function updateBillingStatus(id: string, newStatus: string) {
    setLoading(true);
    const res = await fetch("/api/prescriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, billingStatus: newStatus }),
    });
    if (res.ok) {
      setMessage(`Estado actualizado a ${billingLabels[newStatus]?.label || newStatus}`);
      loadData();
    }
    setLoading(false);
  }

  async function notifyPatient(prescription: Prescription) {
    if (!prescription.patient.whatsappPhone) {
      setMessage("Paciente sin WhatsApp registrado");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: prescription.patient.whatsappPhone,
        body: `Hola ${prescription.patient.name}, tu receta está lista:\n\n💊 ${prescription.productName}\n📋 ${prescription.dosage || ""}\n💰 Total: $${prescription.totalPrice.toFixed(2)}\n👨‍⚕️ Dr/Dra. ${prescription.doctor.name || prescription.doctor.email}`,
        patientId: prescription.patient.id,
      }),
    });
    if (res.ok) {
      setMessage("✅ Notificación enviada por WhatsApp");
      loadData();
    }
    setLoading(false);
  }

  const pendingRx = prescriptions.filter((p) => p.billingStatus === "PENDING");
  const billedRx = prescriptions.filter((p) => p.billingStatus === "BILLED" || p.billingStatus === "DELIVERED");
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 15);
  const outOfStock = products.filter((p) => p.stock <= 0);
  const totalRevenue = billedRx.reduce((sum, rx) => sum + rx.totalPrice, 0);

  if (status === "loading") return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/pharmacist" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Panel de Farmacia</h1>
            <p className="text-slate-500 mt-1">Gestiona recetas, facturación y notificaciones</p>
          </div>

          {message && <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-4 text-[#00F5A0] text-sm">{message}</div>}

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Pendientes</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">{pendingRx.length}</p>
              <p className="text-sm text-slate-500 mt-1">Por facturar</p>
            </div>
            <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Facturadas</p>
              <p className="text-3xl font-bold text-[#00F5A0] mt-2">{billedRx.length}</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Ingresos</p>
              <p className="text-3xl font-bold text-[#00D9FF] mt-2">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Agotados</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{outOfStock.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Stock bajo</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">{lowStock.length}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {["all", "PENDING", "PREPARED", "BILLED", "DELIVERED", "CANCELLED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  filterStatus === s
                    ? "bg-[#00F5A0] text-[#0A0C10]"
                    : "border border-[#30363D] text-slate-400 hover:text-slate-200"
                }`}
              >
                {s === "all" ? "Todas" : billingLabels[s]?.label || s}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {prescriptions.length === 0 ? (
              <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">prescriptions</span>
                <p className="text-slate-400">No hay recetas que mostrar</p>
              </div>
            ) : (
              prescriptions.map((rx) => {
                const billing = billingLabels[rx.billingStatus] || billingLabels.PENDING;
                return (
                  <div key={rx.id} className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${billing.bg} flex items-center justify-center`}>
                          <span className={`material-symbols-outlined ${billing.color}`}>medication</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{rx.patient.name}</p>
                          <p className="text-sm text-slate-500">{rx.productName} · {rx.dosage || "Sin dosis"}</p>
                          <p className="text-xs text-slate-600 mt-1">Dr. {rx.doctor.name || rx.doctor.email} · {new Date(rx.createdAt).toLocaleDateString("es-ES")}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-100">${rx.totalPrice.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{rx.quantity} unidad{rx.quantity > 1 ? "es" : ""}</p>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${billing.bg} ${billing.color}`}>
                          {billing.label}
                        </span>

                        {rx.billingStatus === "PENDING" && (
                          <div className="flex gap-1">
                            <button onClick={() => updateBillingStatus(rx.id, "PREPARED")} className="rounded-lg p-2 text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-colors" title="Marcar como preparada">
                              <span className="material-symbols-outlined text-lg">check</span>
                            </button>
                            <button onClick={() => updateBillingStatus(rx.id, "CANCELLED")} className="rounded-lg p-2 text-red-400 hover:bg-red-400/10 transition-colors" title="Cancelar">
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          </div>
                        )}

                        {rx.billingStatus === "PREPARED" && (
                          <div className="flex gap-1">
                            <button onClick={() => updateBillingStatus(rx.id, "BILLED")} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[#00F5A0]/10 text-[#00F5A0] hover:bg-[#00F5A0]/20 transition-colors">
                              Facturar
                            </button>
                            {rx.patient.whatsappPhone && (
                              <button onClick={() => notifyPatient(rx)} disabled={loading} className="rounded-lg p-2 text-[#25D366] hover:bg-[#25D366]/10 transition-colors disabled:opacity-50" title="Notificar por WhatsApp">
                                <span className="material-symbols-outlined text-lg">send</span>
                              </button>
                            )}
                          </div>
                        )}

                        {rx.billingStatus === "BILLED" && (
                          <button onClick={() => updateBillingStatus(rx.id, "DELIVERED")} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors">
                            Marcar entregada
                          </button>
                        )}
                      </div>
                    </div>

                    {rx.instructions && <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-[#30363D]">{rx.instructions}</p>}
                    {rx.notes && <p className="text-xs text-slate-500 mt-1">{rx.notes}</p>}
                  </div>
                );
              })
            )}
          </div>

          {(outOfStock.length > 0 || lowStock.length > 0) && (
            <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Alertas de Inventario</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {outOfStock.map((p) => (
                  <div key={p.id} className="rounded-xl bg-red-400/5 border border-red-400/30 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-400 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category || "General"}</p>
                    </div>
                    <span className="text-xs font-bold text-red-400 bg-red-400/10 px-3 py-1 rounded-full">Agotado</span>
                  </div>
                ))}
                {lowStock.map((p) => (
                  <div key={p.id} className="rounded-xl bg-amber-400/5 border border-amber-400/30 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-amber-400 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category || "General"}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">{p.stock} u.</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
