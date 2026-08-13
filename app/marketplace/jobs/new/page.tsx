"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/api/marketplace.api";

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createJob({ title, description, company, location, salary });
    router.push("/marketplace/jobs");
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Post a Job</h1>
      <form onSubmit={handleSubmit} className="bg-card shadow rounded p-6 space-y-4">
        <input type="text" placeholder="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 w-full" required />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 w-full" required />
        <input type="text" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} className="border p-2 w-full" />
        <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="border p-2 w-full" />
        <input type="text" placeholder="Salary" value={salary} onChange={(e) => setSalary(e.target.value)} className="border p-2 w-full" />
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded">Post</button>
      </form>
    </div>
  );
}