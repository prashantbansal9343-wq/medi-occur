import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import MedicineImage from "./MedicineImage";

const emptyForm = {
  name: "",
  company: "",
  category: "General",
  mrp: "",
  composition: "",
  imageUrl: "",
  requiresPrescription: false,
};

export default function AdminMedicineCatalogue() {
  const [medicines, setMedicines] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadMedicines = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/medicines?page=${page}&limit=20`);
      setMedicines(res.data.medicines || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines(1);
  }, [loadMedicines]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (med) => {
    setEditingId(med._id);
    setForm({
      name: med.name || "",
      company: med.company || "",
      category: med.category || "General",
      mrp: String(med.mrp || ""),
      composition: med.composition || "",
      imageUrl: med.imageUrl || "",
      requiresPrescription: Boolean(med.requiresPrescription),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.company || !form.mrp) {
      alert("Name, company, and MRP are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        company: form.company,
        category: form.category,
        mrp: Number(form.mrp),
        composition: form.composition,
        imageUrl: form.imageUrl,
        requiresPrescription: form.requiresPrescription,
      };
      if (editingId) {
        await api.put(`/medicines/${editingId}`, payload);
      } else {
        await api.post("/medicines", payload);
      }
      resetForm();
      loadMedicines(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medicine from the catalogue?")) return;
    try {
      await api.delete(`/medicines/${id}`);
      if (editingId === id) resetForm();
      loadMedicines(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-slate-900/60 rounded-xl border border-cyan-300/20 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cyan-300/10 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">Medicine catalogue</h2>
            <p className="text-sm text-slate-400 mt-1">
              {pagination.total} medicines · page {pagination.page} of {pagination.pages}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadMedicines(pagination.page)}
            className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            Refresh
          </button>
        </div>
        <div className="divide-y divide-cyan-300/10 max-h-[32rem] overflow-y-auto">
          {loading && <p className="px-6 py-8 text-sm text-slate-400">Loading…</p>}
          {!loading && medicines.length === 0 && (
            <p className="px-6 py-8 text-sm text-slate-400">No medicines yet. Add one using the form.</p>
          )}
          {medicines.map((med) => (
            <div
              key={med._id}
              className="px-6 py-4 flex gap-4 items-center hover:bg-cyan-500/5"
            >
              <MedicineImage
                src={med.imageUrl}
                alt={med.name}
                className="w-14 h-14 rounded-lg object-cover border border-cyan-300/20 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{med.name}</p>
                <p className="text-sm text-slate-400 truncate">{med.company}</p>
                <p className="text-sm text-emerald-400">₹{med.mrp}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(med)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(med._id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {pagination.pages > 1 && (
          <div className="px-6 py-3 border-t border-cyan-300/10 flex gap-2 justify-center">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => loadMedicines(pagination.page - 1)}
              className="px-3 py-1 rounded bg-slate-800 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() => loadMedicines(pagination.page + 1)}
              className="px-3 py-1 rounded bg-slate-800 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900/60 rounded-xl border border-cyan-300/20 p-6 h-fit sticky top-24">
        <h2 className="text-lg font-semibold text-white mb-1">
          {editingId ? "Edit medicine" : "Add medicine"}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Image URL is shown in retailer search with a placeholder fallback.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            ["name", "Name", "text"],
            ["company", "Company", "text"],
            ["category", "Category", "text"],
            ["mrp", "MRP (₹)", "number"],
            ["composition", "Composition", "text"],
            ["imageUrl", "Image URL", "url"],
          ].map(([key, label, type]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
              <input
                type={type}
                className="w-full border border-cyan-300/20 bg-slate-950/80 text-white rounded-lg px-3 py-2"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.requiresPrescription}
              onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })}
            />
            Requires prescription
          </label>
          {form.imageUrl && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Preview</p>
              <MedicineImage
                src={form.imageUrl}
                alt="Preview"
                className="w-full h-40 rounded-lg object-contain bg-slate-950 border border-cyan-300/20"
              />
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-cyan-500 text-white font-semibold disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-lg bg-slate-700 text-white font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
