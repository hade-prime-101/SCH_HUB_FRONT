// app/dashboard/study-groups/create/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/lib/api/study-groups.api";

export default function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGroup({ name, description, isPrivate });
    router.push("/dashboard/study-groups");
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Study Group</h1>
      <form onSubmit={handleSubmit} className="bg-card shadow rounded p-6 space-y-4">
        <input type="text" placeholder="Group Name" value={name} onChange={e => setName(e.target.value)} className="border p-2 w-full" required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="border p-2 w-full" />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
          Private group
        </label>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded">Create</button>
      </form>
    </div>
  );
}