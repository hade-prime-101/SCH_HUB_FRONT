"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createService } from "@/lib/api/marketplace.api";
import type { ServiceCategory } from "@/types/marketplace";

const categories: ServiceCategory[] = ["TUTORING", "TECH", "BEAUTY", "FASHION", "OTHER"];

export default function NewServicePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("OTHER");
  const [price, setPrice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createService({ title, description, category, price: Number(price) });
    router.push("/dashboard/marketplace/services");
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Service</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 w-full" required />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 w-full" required />
        <select value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory)} className="border p-2 w-full">
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="border p-2 w-full" required />
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded">Create</button>
      </form>
    </div>
  );
}