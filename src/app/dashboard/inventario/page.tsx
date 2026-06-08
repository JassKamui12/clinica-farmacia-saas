'use client';

import { useEffect, useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";

interface Producto {
  id: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  requiresPrescription: boolean;
  isAvailable: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  analgesico:      "bg-red-100 text-red-700",
  antibiotico:     "bg-amber-100 text-amber-700",
  vitamina:        "bg-emerald-100 text-emerald-700",
  antidiabetico:   "bg-blue-100 text-blue-700",
  antihipertensivo:"bg-violet-100 text-violet-700",
  antihistaminico: "bg-pink-100 text-pink-700",
  gastro:          "bg-orange-100 text-orange-700",
  otro:            "bg-slate-100 text-slate-600",
};

export default function InventarioPage() {
  const { profile } = useProfile();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  const esFarmacia = profile?.clinic?.rubroId === "farmacia";

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (showLowStock) params.set("lowStock", "1");
    fetch(`/api/farmacia/productos?${params}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setProductos(d); })
      .finally(() => setLoading(false));
  }, [q, showLowStock]);

  if (!esFarmacia) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <span className="material-symbols-outlined text-5xl mb-3">inventory_2</span>
        <p className="font-medium text-slate-600">Módulo de inventario</p>
        <p className="text-sm mt-1">Disponible solo para clínicas con rubro Farmacia</p>
      </div>
    );
  }

  const stockBajo = productos.filter((p) => p.stock <= p.minStock).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-500 text-sm mt-1">
            {productos.length} productos
            {stockBajo > 0 && (
              <span className="ml-2 text-amber-600 font-medium">· {stockBajo} con stock bajo</span>
            )}
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#051125] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#1b263b] transition-colors">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Agregar producto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto..."
            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56"
          />
        </div>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            showLowStock ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">warning</span>
          Stock bajo
        </button>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse space-y-3">
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-8 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3">inventory_2</span>
          <p className="font-medium">{q ? "Sin resultados" : "Sin productos en inventario"}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productos.map((p) => {
            const isLow = p.stock <= p.minStock;
            const catColor = CATEGORY_COLORS[p.category ?? "otro"] ?? CATEGORY_COLORS.otro;
            return (
              <div key={p.id} className={`rounded-2xl border bg-white p-4 ${isLow && p.stock > 0 ? "border-amber-200" : p.stock === 0 ? "border-red-200" : "border-slate-200"}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">{p.name}</p>
                  {p.category && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${catColor}`}>
                      {p.category}
                    </span>
                  )}
                </div>

                {/* Stock */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className={`text-2xl font-bold ${p.stock === 0 ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-900"}`}>
                      {p.stock}
                    </p>
                    <p className="text-xs text-slate-400">{p.unit}s en stock</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">L {p.price.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">por {p.unit}</p>
                  </div>
                </div>

                {/* Indicadores */}
                <div className="flex items-center gap-2 flex-wrap">
                  {p.stock === 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-red-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Agotado
                    </span>
                  )}
                  {p.stock > 0 && isLow && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Stock bajo (mín. {p.minStock})
                    </span>
                  )}
                  {p.requiresPrescription && (
                    <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                      <span className="material-symbols-outlined text-[12px]">description</span>
                      Requiere receta
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
