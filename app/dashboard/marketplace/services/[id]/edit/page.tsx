"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getService, updateService } from "@/lib/api/marketplace.api";
import type { ServiceCategory } from "@/types/marketplace";

const categories: ServiceCategory[] = ["TUTORING", "TECH", "BEAUTY", "FASHION", "OTHER"];

export default function EditServicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("OTHER");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getService(id).then((s) => {
      setTitle(s.title);
      setDescription(s.description);
      setCategory(s.category);
      setPrice(String(s.price));
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateService(id, { title, description, category, price: Number(price) });
    router.push(`/dashboard/marketplace/services/${id}`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Service</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="border p-2 w-full" required />
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="border p-2 w-full" required />
        <select value={category} onChange={e => setCategory(e.target.value as ServiceCategory)} className="border p-2 w-full">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="border p-2 w-full" required />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
      </form>
    </div>
  );
}