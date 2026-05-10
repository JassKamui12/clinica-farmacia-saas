import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import PrescriptionManager from "./PrescriptionManager";

export const dynamic = "force-dynamic";

export default async function PharmacistDashboard() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "PHARMACIST") {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toLocaleDateString("es-ES", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const [pendingCount, preparedCount, billedCount, products, pendingRx] = await Promise.all([
    prisma.prescription.count({ where: { billingStatus: "PENDING" } }),
    prisma.prescription.count({ where: { billingStatus: "PREPARED" } }),
    prisma.prescription.count({ where: { billingStatus: { in: ["BILLED", "DELIVERED"] } } }),
    prisma.pharmacyProduct.findMany({
      select: { id: true, name: true, stock: true, category: true },
    }),
    prisma.prescription.findMany({
      where: { billingStatus: { in: ["PENDING", "PREPARED"] } },
      include: {
        Patient: { select: { id: true, name: true, whatsappPhone: true } },
        User: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 15);
  const outOfStock = products.filter((p) => p.stock <= 0);

  const serializedRx = pendingRx.map((rx) => ({
    id: rx.id,
    productName: rx.productName,
    dosage: rx.dosage ?? null,
    instructions: rx.instructions ?? null,
    notes: rx.notes ?? null,
    whatsappSent: rx.whatsappSent,
    billingStatus: rx.billingStatus,
    totalPrice: rx.totalPrice,
    quantity: rx.quantity,
    createdAt: rx.createdAt.toISOString(),
    patient: {
      id: rx.Patient.id,
      name: rx.Patient.name,
      whatsappPhone: rx.Patient.whatsappPhone ?? null,
    },
    doctor: {
      name: rx.User.name ?? null,
      email: rx.User.email,
    },
  }));

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar
        activePath="/pharmacist"
        userRole="PHARMACIST"
        userName={session.user.name}
        userEmail={session.user.email}
      />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">
                Bienvenido, {session.user.name}
              </h1>
              <p className="text-slate-500 mt-1 capitalize">{todayStr}</p>
            </div>
            <Link
              href="/inventory"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] px-5 py-2.5 text-sm font-bold text-[#0A0C10] shadow-[0_20px_45px_-20px_rgba(0,245,160,0.5)] hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-lg">inventory_2</span>
              Ver inventario
            </Link>
          </div>

          {/* Stats */}
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Pendientes</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">{pendingCount}</p>
              <p className="text-sm text-slate-500 mt-1">Por preparar</p>
            </div>
            <div className="rounded-2xl border border-[#00D9FF]/30 bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">En preparación</p>
              <p className="text-3xl font-bold text-[#00D9FF] mt-2">{preparedCount}</p>
              <p className="text-sm text-slate-500 mt-1">Listas para facturar</p>
            </div>
            <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Completadas</p>
              <p className="text-3xl font-bold text-[#00F5A0] mt-2">{billedCount}</p>
              <p className="text-sm text-slate-500 mt-1">Facturadas / entregadas</p>
            </div>
            <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Agotados</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{outOfStock.length}</p>
              <p className="text-sm text-slate-500 mt-1">Sin inventario</p>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Stock bajo</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">{lowStock.length}</p>
              <p className="text-sm text-slate-500 mt-1">Menos de 15 u.</p>
            </div>
          </div>

          {/* Alertas de inventario */}
          {(outOfStock.length > 0 || lowStock.length > 0) && (
            <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-amber-400">inventory_2</span>
                <h2 className="text-lg font-semibold text-amber-400">Alertas de Inventario</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {outOfStock.map((p) => (
                  <div key={p.id} className="rounded-xl bg-red-400/5 border border-red-400/30 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-400 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category ?? "General"}</p>
                    </div>
                    <span className="text-xs font-bold text-red-400 bg-red-400/10 px-3 py-1 rounded-full">Agotado</span>
                  </div>
                ))}
                {lowStock.map((p) => (
                  <div key={p.id} className="rounded-xl bg-amber-400/5 border border-amber-400/30 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-amber-400 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category ?? "General"}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">{p.stock} u.</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gestión interactiva de recetas */}
          <PrescriptionManager initialPrescriptions={serializedRx} />

          {/* Quick links */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Link href="/inventory" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#00F5A0]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#00F5A0]">inventory_2</span>
                <h3 className="text-lg font-semibold text-slate-100">Inventario</h3>
              </div>
              <p className="text-sm text-slate-500">Gestiona el stock de productos</p>
              <p className="text-xs text-[#00F5A0] mt-3 group-hover:underline">Ir a inventario →</p>
            </Link>
            <Link href="/whatsapp" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#25D366]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#25D366]">chat</span>
                <h3 className="text-lg font-semibold text-slate-100">WhatsApp</h3>
              </div>
              <p className="text-sm text-slate-500">Conversaciones con pacientes</p>
              <p className="text-xs text-[#25D366] mt-3 group-hover:underline">Ir a WhatsApp →</p>
            </Link>
            <Link href="/prescriptions" className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 hover:border-[#00D9FF]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#00D9FF]">medication</span>
                <h3 className="text-lg font-semibold text-slate-100">Historial Recetas</h3>
              </div>
              <p className="text-sm text-slate-500">Consulta todas las recetas</p>
              <p className="text-xs text-[#00D9FF] mt-3 group-hover:underline">Ver historial →</p>
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
