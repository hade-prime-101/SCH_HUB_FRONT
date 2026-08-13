"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccommodation } from "@/lib/api/marketplace.api";
import type { AccommodationType } from "@/types/marketplace";

const types: AccommodationType[] = ["HOSTEL", "APARTMENT", "SINGLE_ROOM", "SELF_CONTAINED"];

export default function NewAccommodationPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AccommodationType>("HOSTEL");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAccommodation({ title, description, type, price: Number(price), location });
    router.push("/dashboard/marketplace/accommodation");
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">List Accommodation</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="border p-2 w-full" required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="border p-2 w-full" required />
        <select value={type} onChange={e => setType(e.target.value as AccommodationType)} className="border p-2 w-full">
          {types.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
        </select>
        <input type="number" placeholder="Price (₦)" value={price} onChange={e => setPrice(e.target.value)} className="border p-2 w-full" required />
        <input type="text" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} className="border p-2 w-full" required />
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded">Create</button>
      </form>
    </div>
  );
}