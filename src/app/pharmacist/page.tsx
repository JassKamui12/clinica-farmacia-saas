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
  const todayStr = today.toLocaleDateString("es-ES", { weekday: "long", month: "long", day: "numeric" });

  const [pendingCount, preparedCount, billedCount, products, pendingRx] = await Promise.all([
    prisma.prescription.count({ where: { billingStatus: "PENDING" } }),
    prisma.prescription.count({ where: { billingStatus: "PREPARED" } }),
    prisma.prescription.count({ where: { billingStatus: { in: ["BILLED", "DELIVERED"] } } }),
    prisma.pharmacyProduct.findMany({ select: { id: true, name: true, stock: true, category: true } }),
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

  const lowStock  = products.filter((p) => p.stock > 0 && p.stock < 15);
  const outOfStock = products.filter((p) => p.stock <= 0);

  const serializedRx = pendingRx.map((rx) => ({
    id: rx.id, productName: rx.productName, dosage: rx.dosage ?? null,
    instructions: rx.instructions ?? null, notes: rx.notes ?? null,
    whatsappSent: rx.whatsappSent, billingStatus: rx.billingStatus,
    totalPrice: rx.totalPrice, quantity: rx.quantity,
    createdAt: rx.createdAt.toISOString(),
    patient: { id: rx.Patient.id, name: rx.Patient.name, whatsappPhone: rx.Patient.whatsappPhone ?? null },
    doctor: { name: rx.User.name ?? null, email: rx.User.email },
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/pharmacist" userRole="PHARMACIST" userName={session.user.name} userEmail={session.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Bienvenido, {session.user.name}</h1>
              <p className="text-slate-500 text-sm mt-1 capitalize">{todayStr}</p>
            </div>
            <Link href="/inventory" className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
              <span className="material-symbols-outlined text-lg">inventory_2</span>
              Ver inventario
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pendientes</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{pendingCount}</p>
              <p className="text-sm text-slate-500 mt-1">Por preparar</p>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">En preparación</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{preparedCount}</p>
              <p className="text-sm text-slate-500 mt-1">Listas para facturar</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Completadas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{billedCount}</p>
              <p className="text-sm text-slate-500 mt-1">Facturadas / entregadas</p>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Agotados</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{outOfStock.length}</p>
              <p className="text-sm text-slate-500 mt-1">Sin inventario</p>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Stock bajo</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{lowStock.length}</p>
              <p className="text-sm text-slate-500 mt-1">Menos de 15 u.</p>
            </div>
          </div>

          {(outOfStock.length > 0 || lowStock.length > 0) && (
            <section className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-amber-600">inventory_2</span>
                <h2 className="text-base font-semibold text-amber-800">Alertas de Inventario</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {outOfStock.map((p) => (
                  <div key={p.id} className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-700 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category ?? "General"}</p>
                    </div>
                    <span className="text-xs font-bold text-red-700 bg-white border border-red-200 px-3 py-1 rounded-full">Agotado</span>
                  </div>
                ))}
                {lowStock.map((p) => (
                  <div key={p.id} className="rounded-xl bg-white border border-amber-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-amber-700 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category ?? "General"}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">{p.stock} u.</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <PrescriptionManager initialPrescriptions={serializedRx} />

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { href: "/inventory",    icon: "inventory_2",  color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    title: "Inventario",       desc: "Gestiona el stock de productos",    arrow: "text-blue-600" },
              { href: "/whatsapp",     icon: "chat",         color: "text-[#25D366]",   bg: "bg-emerald-50", border: "border-emerald-200", title: "WhatsApp",         desc: "Conversaciones con pacientes",      arrow: "text-[#25D366]" },
              { href: "/prescriptions",icon: "medication",   color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200",  title: "Historial Recetas",desc: "Consulta todas las recetas",        arrow: "text-violet-600" },
            ].map((c) => (
              <Link key={c.href} href={c.href} className={`bg-white rounded-2xl border ${c.border} shadow-sm p-6 hover:shadow-md transition-all group`}>
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <span className={`material-symbols-outlined ${c.color}`}>{c.icon}</span>
                </div>
                <p className="font-semibold text-slate-900">{c.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{c.desc}</p>
                <p className={`text-xs font-medium mt-3 ${c.arrow} group-hover:underline`}>Abrir →</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
