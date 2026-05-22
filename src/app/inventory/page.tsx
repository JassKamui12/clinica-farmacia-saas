'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type AppRole = "ADMIN" | "DOCTOR" | "PHARMACIST" | "RECEPTIONIST";

interface Product {
  id: string; name: string; category?: string | null; indications?: string | null;
  contraindications?: string | null; price: number; stock: number; isAvailable: boolean;
}

const INPUT = "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors";

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("");
  const [showStockOnly, setShowStockOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category: "", indications: "", contraindications: "", price: 0, stock: 0, isAvailable: true });

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

  const lowStock    = products.filter((p) => p.stock > 0 && p.stock < 15).length;
  const outOfStock  = products.filter((p) => p.stock <= 0).length;
  const totalValue  = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ name: "", category: "", indications: "", contraindications: "", price: 0, stock: 0, isAvailable: true });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({ name: p.name, category: p.category || "", indications: p.indications || "", contraindications: p.contraindications || "", price: p.price, stock: p.stock, isAvailable: p.isAvailable });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage("");
    const method = editingProduct ? "PATCH" : "POST";
    const body = editingProduct ? { id: editingProduct.id, ...form } : form;
    const res = await fetch("/api/products", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setMessage(editingProduct ? "Producto actualizado" : "Producto creado"); setShowModal(false); loadData(); }
    else setMessage("Error al guardar");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    if (res.ok) { setMessage("Producto eliminado"); loadData(); }
  };

  if (status === "loading") return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar activePath="/inventory" userRole={(session?.user.role ?? "ADMIN") as AppRole} userName={session?.user.name} userEmail={session?.user.email} />

      <div className="ml-[240px] p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inventario de Farmacia</h1>
              <p className="text-slate-500 text-sm mt-1">{products.length} productos registrados</p>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
              <span className="material-symbols-outlined text-lg">add</span>
              Nuevo Producto
            </button>
          </div>

          {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">{message}</div>}

          {/* Stats */}
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Productos</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{products.length}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Stock bajo</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{lowStock}</p>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Agotados</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{outOfStock}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Valor total</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">L {totalValue.toFixed(0)}</p>
            </div>
          </div>

          {/* Search & filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar producto o categoría..." className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm" />
            </div>
            <button onClick={() => setShowStockOnly(!showStockOnly)} className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all border ${showStockOnly ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-300 text-slate-600 hover:border-blue-400"}`}>
              Con stock
            </button>
          </div>

          {/* Product grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const isOut = p.stock <= 0;
              const isLow = p.stock > 0 && p.stock < 15;
              return (
                <div key={p.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${isOut ? "border-red-200" : isLow ? "border-amber-200" : "border-slate-200"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{p.category || "General"}</p>
                    </div>
                    <span className="text-base font-bold text-blue-600">L {p.price.toFixed(2)}</span>
                  </div>

                  {/* Stock bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Stock</span>
                      <span className={`text-sm font-bold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600"}`}>{p.stock} unidades</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isOut ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, p.stock * 5)}%` }} />
                    </div>
                  </div>

                  {p.indications && <p className="text-xs text-slate-400 mb-4 line-clamp-2">{p.indications}</p>}

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button onClick={() => openEdit(p)} className="flex-1 rounded-lg border border-slate-300 py-1.5 text-xs text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="flex-1 rounded-lg border border-red-200 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium">Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">inventory_2</span>
              <p className="text-slate-500 font-medium">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><span className="material-symbols-outlined text-lg">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Nombre del producto *" className={INPUT} />
              <input value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} placeholder="Categoría" className={INPUT} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: Number(e.target.value)})} placeholder="Precio (L)" className={INPUT} />
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm({...form, stock: Number(e.target.value)})} placeholder="Stock" className={INPUT} />
              </div>
              <textarea value={form.indications} onChange={(e) => setForm({...form, indications: e.target.value})} placeholder="Indicaciones" rows={2} className={`${INPUT} resize-none`} />
              <textarea value={form.contraindications} onChange={(e) => setForm({...form, contraindications: e.target.value})} placeholder="Contraindicaciones" rows={2} className={`${INPUT} resize-none`} />
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({...form, isAvailable: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                Disponible para venta
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 rounded-xl bg-blue-600 text-white py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors">{editingProduct ? "Actualizar" : "Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
