"use client";
import { useEffect, useState } from "react";
import { listLostFound, createLostFound, resolveLostFound } from "@/lib/api/marketplace.api";
import type { LostFoundItem, CreateLostFoundPayload } from "@/types/marketplace";

export default function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateLostFoundPayload>({ title: "", description: "", type: "LOST", location: "" });

  const fetchItems = () => {
    listLostFound({ page, limit }).then((res) => {
      setItems(res.data);
      setTotal(res.total);
    });
  };

  useEffect(() => {
    fetchItems();
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLostFound(form);
    setShowForm(false);
    setForm({ title: "", description: "", type: "LOST", location: "" });
    fetchItems();
  };

  const handleResolve = async (id: string) => {
    await resolveLostFound(id);
    fetchItems();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lost & Found</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground px-4 py-2 rounded">
          {showForm ? "Cancel" : "Report Item"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white shadow rounded p-4 mb-6 space-y-3">
          <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border p-2 w-full" required />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border p-2 w-full" required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'LOST' | 'FOUND' })} className="border p-2 w-full">
            <option value="LOST">Lost</option>
            <option value="FOUND">Found</option>
          </select>
          <input type="text" placeholder="Location" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border p-2 w-full" />
          <button type="submit" className="bg-success text-white px-4 py-2 rounded">Submit</button>
        </form>
      )}
      {items.map((item) => (
        <div key={item.id} className="bg-white shadow rounded p-4 mb-3 flex justify-between items-center">
          <div>
            <span className="font-medium">{item.title}</span>
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">{item.type}</span>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <p className="text-xs text-gray-400">{item.location}</p>
          </div>
          {!item.resolved && (
            <button onClick={() => handleResolve(item.id)} className="text-sm bg-success/10 text-success px-2 py-1 rounded">
              Mark Resolved
            </button>
          )}
          {item.resolved && <span className="text-sm text-success font-medium">Resolved</span>}
        </div>
      ))}
      {total > limit && (
        <div className="flex justify-between mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn">Prev</button>
          <span>Page {page}</span>
          <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="btn">Next</button>
        </div>
      )}
    </div>
  );
}