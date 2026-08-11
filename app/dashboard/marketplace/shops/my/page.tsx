"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyShop, createShop, updateShop } from "@/lib/marketplace.api";
import type { Shop } from "@/types/marketplace";

export default function MyShopPage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyShop()
      .then((data) => {
        setShop(data);
        setName(data.name);
        setDescription(data.description);
      })
      .catch(() => {
        // No shop yet
        setShop(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (shop) {
      const updated = await updateShop({ name, description });
      setShop(updated);
    } else {
      const created = await createShop({ name, description });
      setShop(created);
    }
    alert("Shop saved.");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{shop ? "Edit Your Shop" : "Create Your Shop"}</h1>
      <div className="bg-white shadow rounded p-6 space-y-4">
        <input
          type="text"
          placeholder="Shop Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">
          {shop ? "Update Shop" : "Create Shop"}
        </button>
      </div>
    </div>
  );
}