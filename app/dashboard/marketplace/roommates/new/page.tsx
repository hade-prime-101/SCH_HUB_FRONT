"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoommateRequest } from "@/lib/api/marketplace.api";

export default function NewRoommatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "ANY">("ANY");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRoommateRequest({ title, description, budget: Number(budget), gender });
    router.push("/dashboard/marketplace/roommates");
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Roommate Request</h1>
      <form onSubmit={handleSubmit} className="bg-card shadow rounded p-6 space-y-4">
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 w-full" required />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 w-full" required />
        <input type="number" placeholder="Budget (₦)" value={budget} onChange={(e) => setBudget(e.target.value)} className="border p-2 w-full" required />
        <select value={gender} onChange={(e) => setGender(e.target.value as any)} className="border p-2 w-full">
          <option value="ANY">Any Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded">Create</button>
      </form>
    </div>
  );
}