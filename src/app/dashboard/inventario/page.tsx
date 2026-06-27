'use client';

import { useEffect, useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";

interface Producto {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  indications: string | null;
  contraindications: string | null;
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

const CATEGORIES = Object.keys(CATEGORY_COLORS);
const UNITS = ["unidad", "caja", "frasco", "blister", "tableta", "jarabe"];

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all";
const LABEL = "block text-xs font-semibold text-slate-600 mb-1.5";

interface FormState {
  name: string;
  category: string;
  description: string;
  indications: string;
  contraindications: string;
  price: string;
  stock: string;
  minStock: string;
  unit: string;
  requiresPrescription: boolean;
  isAvailable: boolean;
}

const EMPTY_FORM: FormState = {
  name: "", category: "otro", description: "", indications: "", contraindications: "",
  price: "", stock: "", minStock: "5", unit: "unidad", requiresPrescription: false, isAvailable: true,
};

function toForm(p: Producto): FormState {
  return {
    name: p.name,
    category: p.category ?? "otro",
    description: p.description ?? "",
    indications: p.indications ?? "",
    contraindications: p.contraindications ?? "",
    price: String(p.price),
    stock: String(p.stock),
    minStock: String(p.minStock),
    unit: p.unit,
    requiresPrescription: p.requiresPrescription,
    isAvailable: p.isAvailable,
  };
}

export default function InventarioPage() {
  const { profile } = useProfile();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  // Modal / formulario
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const esFarmacia = profile?.clinic?.rubroId === "farmacia";

  function loadProductos() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (showLowStock) params.set("lowStock", "1");
    fetch(`/api/farmacia/productos?${params}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setProductos(d); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, showLowStock]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(p: Producto) {
    setEditingId(p.id);
    setForm(toForm(p));
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || form.name.trim().length < 2) {
      setFormError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock || "0", 10);
    const minStock = parseInt(form.minStock || "0", 10);
    if (Number.isNaN(price) || price < 0) { setFormError("Precio inválido."); return; }
    if (Number.isNaN(stock) || stock < 0) { setFormError("Stock inválido."); return; }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || undefined,
      indications: form.indications.trim() || undefined,
      contraindications: form.contraindications.trim() || undefined,
      price,
      stock,
      minStock: Number.isNaN(minStock) ? 5 : minStock,
      unit: form.unit,
      requiresPrescription: form.requiresPrescription,
      isAvailable: form.isAvailable,
    };

    setSaving(true);
    try {
      const url = editingId ? `/api/farmacia/productos/${editingId}` : "/api/farmacia/productos";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error ?? "No se pudo guardar el producto.");
        return;
      }
      setShowForm(false);
      loadProductos();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Producto) {
    if (!confirm(`¿Eliminar "${p.name}" del inventario?`)) return;
    const res = await fetch(`/api/farmacia/productos/${p.id}`, { method: "DELETE" });
    if (res.ok) loadProductos();
  }

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
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[#051125] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#1b263b] transition-colors"
        >
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
              <div key={p.id} className={`group rounded-2xl border bg-white p-4 ${isLow && p.stock > 0 ? "border-amber-200" : p.stock === 0 ? "border-red-200" : "border-slate-200"}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">{p.name}</p>
                  {p.category && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${catColor}`}>
                      {p.category}
                    </span>
                  )}
                </div>

                {p.indications && (
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2" title={p.indications}>
                    <span className="font-medium text-slate-600">Para:</span> {p.indications}
                  </p>
                )}

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
                <div className="flex items-center gap-2 flex-wrap min-h-[18px]">
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

                {/* Acciones */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-red-600 transition-colors ml-auto"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal alta/edición */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Editar producto" : "Nuevo producto"}</h2>
              <button onClick={() => !saving && setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={LABEL}>Nombre *</label>
                <input className={INPUT} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Acetaminofén 500mg" autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Categoría</label>
                  <select className={INPUT} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Unidad</label>
                  <select className={INPUT} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LABEL}>Precio (L) *</label>
                  <input className={INPUT} type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className={LABEL}>Stock *</label>
                  <input className={INPUT} type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className={LABEL}>Stock mín.</label>
                  <input className={INPUT} type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="5" />
                </div>
              </div>

              <div>
                <label className={LABEL}>Indicado para (qué trata / para qué sirve)</label>
                <textarea className={INPUT} rows={2} value={form.indications} onChange={(e) => setForm({ ...form, indications: e.target.value })} placeholder="Ej: Dolor leve a moderado, fiebre. La IA usa este texto para responder a los pacientes." />
              </div>

              <div>
                <label className={LABEL}>Descripción / cómo se aplica</label>
                <textarea className={INPUT} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Vía oral. 1 tableta cada 8 horas con alimentos." />
              </div>

              <div>
                <label className={LABEL}>Contraindicaciones</label>
                <textarea className={INPUT} rows={2} value={form.contraindications} onChange={(e) => setForm({ ...form, contraindications: e.target.value })} placeholder="Ej: No usar en daño hepático severo." />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.requiresPrescription} onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })} className="rounded border-slate-300" />
                  Requiere receta
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="rounded border-slate-300" />
                  Disponible
                </label>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#051125] text-white text-sm font-semibold hover:bg-[#1b263b] transition-colors disabled:opacity-50">
                  {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
