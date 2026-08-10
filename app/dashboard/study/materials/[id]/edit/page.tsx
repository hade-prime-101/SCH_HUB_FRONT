// app/dashboard/study/materials/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api";
import type { Material } from "@/types/study";

export default function EditMaterialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/study/materials/${id}`).then((material: Material) => {
      setTitle(material.title);
      setCourseCode(material.courseCode || "");
      setCourseTitle(material.courseTitle || "");
      setDescription(material.description || "");
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiPatch(`/study/materials/${id}`, { title, courseCode, courseTitle, description });
    router.push(`/dashboard/study/materials/${id}`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Material</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input
          type="text" value={title} onChange={e => setTitle(e.target.value)}
          className="border p-2 w-full" required
        />
        <input
          type="text" value={courseCode} onChange={e => setCourseCode(e.target.value)}
          placeholder="Course Code" className="border p-2 w-full"
        />
        <input
          type="text" value={courseTitle} onChange={e => setCourseTitle(e.target.value)}
          placeholder="Course Title" className="border p-2 w-full"
        />
        <textarea
          value={description} onChange={e => setDescription(e.target.value)}
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Changes
        </button>
      </form>
    </div>
  );
}