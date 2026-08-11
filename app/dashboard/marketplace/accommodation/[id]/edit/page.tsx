"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccommodation, updateAccommodation } from "@/lib/marketplace.api";
import type { AccommodationType } from "@/types/marketplace";

const types: AccommodationType[] = ["HOSTEL", "APARTMENT", "SINGLE_ROOM", "SELF_CONTAINED"];

export default function EditAccommodationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AccommodationType>("HOSTEL");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAccommodation(id).then((acc) => {
      setTitle(acc.title);
      setDescription(acc.description);
      setType(acc.type);
      setPrice(String(acc.price));
      setLocation(acc.location);
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAccommodation(id, { title, description, type, price: Number(price), location });
    router.push(`/dashboard/marketplace/accommodation/${id}`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Accommodation</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="border p-2 w-full" required />
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="border p-2 w-full" required />
        <select value={type} onChange={e => setType(e.target.value as AccommodationType)} className="border p-2 w-full">
          {types.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
        </select>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="border p-2 w-full" required />
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="border p-2 w-full" required />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
      </form>
    </div>
  );
}