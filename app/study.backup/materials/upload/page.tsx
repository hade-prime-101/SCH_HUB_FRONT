// app/study/materials/upload/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

export default function UploadMaterialPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [error, setError] = useState<string | null>(null);

  // Single upload state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE" | "LINK_ONLY">("PUBLIC");

  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkJson, setBulkJson] = useState("");

  const handleSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("File required");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("visibility", visibility);
    if (courseCode) formData.append("courseCode", courseCode);
    if (courseTitle) formData.append("courseTitle", courseTitle);
    if (description) formData.append("description", description);
    try {
      await apiPost("/study/materials", formData, true);
      router.push("/study/materials");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulk = async () => {
    if (bulkFiles.length === 0) return setError("Select files");
    let materials;
    try {
      materials = JSON.parse(bulkJson || "[]");
    } catch {
      return setError("Invalid JSON for materials");
    }
    if (!Array.isArray(materials) || materials.length !== bulkFiles.length) {
      return setError("Materials array length must match number of files");
    }
    const formData = new FormData();
    bulkFiles.forEach((f) => formData.append("files", f));
    formData.append("materials", JSON.stringify(materials));
    try {
      await apiPost("/study/materials/bulk", formData, true);
      router.push("/study/materials");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Upload Material</h1>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setMode("single")}
          className={`px-4 py-2 rounded ${mode === "single" ? "bg-primary text-primary-foreground" : "bg-secondary/50"}`}
        >
          Single Upload
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`px-4 py-2 rounded ${mode === "bulk" ? "bg-primary text-primary-foreground" : "bg-secondary/50"}`}
        >
          Bulk Upload
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      {mode === "single" ? (
        <form onSubmit={handleSingle} className="bg-card shadow rounded p-6 space-y-4 max-w-xl">
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required />
          <input
            type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}
            className="border p-2 w-full" required
          />
          <input
            type="text" placeholder="Course Code" value={courseCode}
            onChange={e => setCourseCode(e.target.value)} className="border p-2 w-full"
          />
          <input
            type="text" placeholder="Course Title" value={courseTitle}
            onChange={e => setCourseTitle(e.target.value)} className="border p-2 w-full"
          />
          <textarea
            placeholder="Description" value={description}
            onChange={e => setDescription(e.target.value)} className="border p-2 w-full"
          />
          <select value={visibility} onChange={e => setVisibility(e.target.value as any)} className="border p-2 w-full">
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="LINK_ONLY">Link Only</option>
          </select>
          <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded">
            Upload
          </button>
        </form>
      ) : (
        <div className="bg-card shadow rounded p-6 max-w-xl space-y-4">
          <input type="file" multiple onChange={e => setBulkFiles(Array.from(e.target.files || []))} />
          <textarea
            placeholder='[{"title":"...","visibility":"PUBLIC"}]' value={bulkJson}
            onChange={e => setBulkJson(e.target.value)} className="border p-2 w-full" rows={6}
          />
          <button onClick={handleBulk} className="bg-success text-primary-foreground px-6 py-2 rounded">
            Bulk Upload
          </button>
        </div>
      )}
    </div>
  );
}