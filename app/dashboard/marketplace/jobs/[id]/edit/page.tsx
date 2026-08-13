"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJob, updateJob } from "@/lib/api/marketplace.api";

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJob(id).then((job) => {
      setTitle(job.title);
      setDescription(job.description);
      setCompany(job.company || "");
      setLocation(job.location || "");
      setSalary(job.salary || "");
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateJob(id, { title, description, company, location, salary });
    router.push(`/dashboard/marketplace/jobs/${id}`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Job</h1>
      <form onSubmit={handleSubmit} className="bg-card shadow rounded p-6 space-y-4">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="border p-2 w-full" required />
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="border p-2 w-full" required />
        <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="border p-2 w-full" />
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="border p-2 w-full" />
        <input type="text" value={salary} onChange={e => setSalary(e.target.value)} className="border p-2 w-full" />
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded">Save</button>
      </form>
    </div>
  );
}