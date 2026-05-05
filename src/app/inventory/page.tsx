'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

interface Product {
  id: string;
  name: string;
  category?: string | null;
  indications?: string | null;
  contraindications?: string | null;
  price: number;
  stock: number;
  isAvailable: boolean;
}

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("");
  const [showStockOnly, setShowStockOnly] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const res = await fetch("/api/products");
    setProducts(await res.json());
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { loadData(); }
  }, [status, loadData]);

  const filtered = products.filter((p) => {
    if (filter && !p.name.toLowerCase().includes(filter.toLowerCase()) && !(p.category || "").toLowerCase().includes(filter.toLowerCase())) return false;
    if (showStockOnly && p.stock === 0) return false;
    return true;
  });

  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 15).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  if (status === "loading") return <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-[#0A0C10] text-slate-200">
      <Sidebar activePath="/inventory" userRole={session?.user.role as "ADMIN" | "DOCTOR" | "PHARMACIST"} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Inventario de Farmacia</h1>
              <p className="text-slate-500 mt-1">{products.length} productos registrados</p>
            </div>
            <Link href="/" className="rounded-2xl border border-[#30363D] px-5 py-2.5 text-sm text-slate-300 hover:border-[#00F5A0] hover:text-[#00F5A0] transition-colors">
              ← Volver
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Productos</p>
              <p className="text-3xl font-bold text-slate-100 mt-2">{products.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Stock bajo</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">{lowStock}</p>
            </div>
            <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Agotados</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{outOfStock}</p>
            </div>
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Valor total</p>
              <p className="text-3xl font-bold text-[#00D9FF] mt-2">${totalValue.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar producto o categoría..."
              className="flex-1 rounded-2xl border border-[#30363D] bg-[#161B22] px-5 py-3 text-sm text-slate-200 outline-none focus:border-[#00F5A0]"
            />
            <button
              onClick={() => setShowStockOnly(!showStockOnly)}
              className={`rounded-2xl px-5 py-3 text-sm font-medium transition-all ${
                showStockOnly ? "bg-[#00F5A0] text-[#0A0C10]" : "border border-[#30363D] text-slate-400 hover:text-slate-200"
              }`}
            >
              Con stock
            </button>
          </div>

          {message && <div className="rounded-2xl border border-[#00F5A0]/30 bg-[#00F5A0]/10 p-4 text-[#00F5A0] text-sm">{message}</div>}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className={`rounded-2xl border p-5 ${p.stock <= 0 ? "border-red-400/30 bg-red-400/5" : "border-[#30363D] bg-[#161B22]"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-100">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.category || "General"}</p>
                  </div>
                  <span className="text-sm font-bold text-[#00F5A0]">${p.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex-1 mr-3">
                    <div className="h-2 rounded-full bg-[#0A0C10] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${p.stock > 20 ? "bg-[#00F5A0]" : p.stock > 0 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${Math.min(100, p.stock * 5)}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${p.stock <= 0 ? "text-red-400" : p.stock < 15 ? "text-amber-400" : "text-slate-300"}`}>
                    {p.stock}u
                  </span>
                </div>
                {p.indications && <p className="text-xs text-slate-600 mt-3 truncate">{p.indications}</p>}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">inventory_2</span>
              <p className="text-slate-500">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
