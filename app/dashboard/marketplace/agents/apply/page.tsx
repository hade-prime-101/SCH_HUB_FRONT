"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyForAgent } from "@/lib/api/marketplace.api";

export default function ApplyAgentPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Student ID image is required.");
    setLoading(true);
    try {
      await applyForAgent({ fullName, studentId, department }, file);
      router.push("/dashboard/marketplace");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Become an Accommodation Agent</h1>
      {error && <div className="bg-destructive/10 text-destructive p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-card shadow rounded p-6 space-y-4">
        <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="border p-2 w-full" required />
        <input type="text" placeholder="Student ID Number" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="border p-2 w-full" required />
        <input type="text" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className="border p-2 w-full" required />
        <div>
          <label className="block mb-1">Upload Student ID Image</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded w-full disabled:opacity-50">
          {loading ? "Submitting..." : "Apply"}
        </button>
      </form>
    </div>
  );
}