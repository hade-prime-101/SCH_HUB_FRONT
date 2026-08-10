"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { School, Plus, Pencil, AlertCircle, X, Check } from "lucide-react";

interface School {
  id: string;
  name: string;
  shortCode: string;
  location?: string;
  country?: string;
  isActive?: boolean;
  _count?: { users: number; faculties: number };
}

function SchoolModal({
  school,
  onClose,
  onSaved,
}: {
  school?: School;
  onClose: () => void;
  onSaved: (s: School) => void;
}) {
  const [form, setForm] = useState({
    name:      school?.name      ?? "",
    shortCode: school?.shortCode ?? "",
    location:  school?.location  ?? "",
    country:   school?.country   ?? "Nigeria",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name, shortCode: form.shortCode,
      };
      if (form.location) payload.location = form.location;
      if (form.country)  payload.country  = form.country;

      const result = school
        ? await adminApi.updateSchool(school.id, payload)
        : await adminApi.createSchool(payload);
      onSaved(result as School);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-foreground">{school ? "Edit School" : "Create School"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {error && (
          <div className="mb-4 bg-destructive/10 text-destructive rounded-xl p-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: "School Name *", field: "name",      required: true },
            { label: "Short Code *",  field: "shortCode", required: true },
            { label: "Location",      field: "location",  required: false },
            { label: "Country",       field: "country",   required: false },
          ].map(({ label, field, required }) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{label}</label>
              <input
                required={required}
                value={(form as any)[field]}
                onChange={(e) => set(field, e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity">
              {loading ? "Saving…" : school ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminSchoolsPage() {
  const [schools, setSchools]   = useState<School[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [modal, setModal]       = useState<{ open: boolean; school?: School }>({ open: false });

  useEffect(() => {
    adminApi.getSchools()
      .then((d: any) => setSchools(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(s: School) {
    setSchools((prev) => {
      const exists = prev.find((x) => x.id === s.id);
      return exists ? prev.map((x) => x.id === s.id ? s : x) : [s, ...prev];
    });
    setModal({ open: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schools</h1>
          <p className="text-muted-foreground text-sm mt-1">{schools.length} schools on the platform</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New School
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-card rounded-2xl p-5 h-36 animate-pulse" />)}
        </div>
      ) : schools.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground text-sm">No schools yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.map((school) => (
            <div key={school.id} className="bg-card rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <School className="w-5 h-5 text-primary" />
                </div>
                <button
                  onClick={() => setModal({ open: true, school })}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-foreground">{school.name}</p>
                <p className="text-xs text-muted-foreground">{school.shortCode}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto flex-wrap">
                {school.location && <span>{school.location}</span>}
                {school._count?.users !== undefined && <span>{school._count.users} users</span>}
                {school._count?.faculties !== undefined && <span>{school._count.faculties} faculties</span>}
                <span className={`ml-auto font-semibold px-2 py-0.5 rounded-full ${school.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                  {school.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <SchoolModal
          school={modal.school}
          onClose={() => setModal({ open: false })}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
