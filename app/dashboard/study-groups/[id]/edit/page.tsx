// app/dashboard/study-groups/[id]/edit/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGroup, updateGroup } from "@/lib/api/study-groups.api";

export default function EditGroupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    getGroup(id).then((g) => {
      setName(g.name);
      setDescription(g.description || "");
      setIsPrivate(g.isPrivate);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateGroup(id, { name, description, isPrivate });
    router.push(`/dashboard/study-groups/${id}`);
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Group</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="border p-2 w-full" required />
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="border p-2 w-full" />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
          Private
        </label>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
      </form>
    </div>
  );
}