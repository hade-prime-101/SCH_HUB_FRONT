"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listAllSchools, createSchool, updateSchool } from "@/lib/api/super-admin.api";
import type { School, CreateSchoolPayload } from "@/types/super-admin";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateSchoolPayload>({ name: "", domain: "" });

  const refresh = () => listAllSchools().then(setSchools);
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (editingId) {
      await updateSchool(editingId, form);
    } else {
      await createSchool(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", domain: "" });
    refresh();
  };

  const handleEdit = (school: School) => {
    setForm({ name: school.name, domain: school.domain || "" });
    setEditingId(school.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Schools</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", domain: "" }); }} className="bg-primary text-primary-foreground px-4 py-2 rounded">Add School</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-card rounded p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit" : "New"} School</h2>
            <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 w-full mb-2" />
            <input type="text" placeholder="Domain" value={form.domain || ""} onChange={e => setForm({...form, domain: e.target.value})} className="border p-2 w-full mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="bg-secondary/50 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleSave} className="bg-success text-primary-foreground px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {schools.map(school => (
          <div key={school.id} className="bg-card shadow rounded p-4">
            <p className="font-medium">{school.name}</p>
            <p className="text-sm text-muted-foreground">{school.domain}</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => handleEdit(school)} className="text-primary">Edit</button>
              <Link href={`/dashboard/super-admin/faculties?schoolId=${school.id}`} className="text-green-600">Faculties</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}