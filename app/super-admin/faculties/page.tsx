"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api/admin";
import { BookMarked, Plus, Trash2, AlertCircle, X, ChevronDown, ChevronRight } from "lucide-react";

interface School   { id: string; name: string; shortCode: string }
interface Faculty  { id: string; name: string; departments?: Department[] }
interface Department { id: string; name: string; shortCode?: string }

function AddModal({
  title, fields, onClose, onSubmit, loading, error,
}: {
  title: string;
  fields: { label: string; key: string; required?: boolean }[];
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, ""]))
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        {error && (
          <div className="mb-4 bg-destructive/10 text-destructive rounded-xl p-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="flex flex-col gap-4">
          {fields.map(({ label, key, required }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{label}</label>
              <input
                required={required}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity">
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminFacultiesPage() {
  const [schools, setSchools]         = useState<School[]>([]);
  const [selectedSchool, setSelected] = useState<School | null>(null);
  const [faculties, setFaculties]     = useState<Faculty[]>([]);
  const [expanded, setExpanded]       = useState<Record<string, boolean>>({});
  const [depts, setDepts]             = useState<Record<string, Department[]>>({});
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [modal, setModal]             = useState<null | "faculty" | { type: "dept"; facultyId: string }>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError]   = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  useEffect(() => {
    adminApi.getSchools()
      .then((d: any) => setSchools(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e.message));
  }, []);

  const loadFaculties = useCallback(async (school: School) => {
    setLoading(true); setError(null);
    try {
      const data: any = await adminApi.getFaculties(school.id);
      setFaculties(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  function selectSchool(school: School) {
    setSelected(school);
    setFaculties([]);
    setExpanded({});
    setDepts({});
    loadFaculties(school);
  }

  async function toggleFaculty(faculty: Faculty) {
    const next = !expanded[faculty.id];
    setExpanded((p) => ({ ...p, [faculty.id]: next }));
    if (next && !depts[faculty.id]) {
      try {
        const data: any = await adminApi.getDepartments(faculty.id);
        setDepts((p) => ({ ...p, [faculty.id]: Array.isArray(data) ? data : [] }));
      } catch (e: any) { alert(e.message); }
    }
  }

  async function addFaculty(data: Record<string, string>) {
    if (!selectedSchool) return;
    setModalLoading(true); setModalError(null);
    try {
      const created: any = await adminApi.createFaculty(selectedSchool.id, data.name);
      setFaculties((p) => [...p, created]);
      setModal(null);
    } catch (e: any) { setModalError(e.message); }
    finally { setModalLoading(false); }
  }

  async function deleteFaculty(id: string) {
    if (!confirm("Delete this faculty?")) return;
    setDeletingId(id);
    try {
      await adminApi.deleteFaculty(id);
      setFaculties((p) => p.filter((f) => f.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setDeletingId(null); }
  }

  async function addDepartment(facultyId: string, data: Record<string, string>) {
    setModalLoading(true); setModalError(null);
    try {
      const created: any = await adminApi.createDepartment(facultyId, { name: data.name, shortCode: data.shortCode });
      setDepts((p) => ({ ...p, [facultyId]: [...(p[facultyId] ?? []), created] }));
      setModal(null);
    } catch (e: any) { setModalError(e.message); }
    finally { setModalLoading(false); }
  }

  async function deleteDepartment(facultyId: string, deptId: string) {
    if (!confirm("Delete this department?")) return;
    setDeletingId(deptId);
    try {
      await adminApi.deleteDepartment(deptId);
      setDepts((p) => ({ ...p, [facultyId]: (p[facultyId] ?? []).filter((d) => d.id !== deptId) }));
    } catch (e: any) { alert(e.message); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Faculties & Departments</h1>
        <p className="text-muted-foreground text-sm mt-1">Select a school to manage its structure</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* School picker */}
      <div className="flex gap-2 flex-wrap">
        {schools.map((s) => (
          <button
            key={s.id}
            onClick={() => selectSchool(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedSchool?.id === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            {s.shortCode}
          </button>
        ))}
      </div>

      {selectedSchool && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{selectedSchool.name}</h2>
            <button
              onClick={() => { setModal("faculty"); setModalError(null); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Add Faculty
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-card rounded-2xl p-4 h-14 animate-pulse" />)}
            </div>
          ) : faculties.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center text-muted-foreground text-sm">No faculties yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {faculties.map((faculty) => (
                <div key={faculty.id} className="bg-card rounded-2xl overflow-hidden">
                  {/* Faculty row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleFaculty(faculty)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {expanded[faculty.id]
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      }
                      <BookMarked className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium text-foreground text-sm">{faculty.name}</span>
                    </button>
                    <button
                      onClick={() => { setModal({ type: "dept", facultyId: faculty.id }); setModalError(null); }}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                      title="Add department"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      disabled={deletingId === faculty.id}
                      onClick={() => deleteFaculty(faculty.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      title="Delete faculty"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Departments */}
                  {expanded[faculty.id] && (
                    <div className="border-t border-border px-4 py-2 flex flex-col gap-1">
                      {!depts[faculty.id] ? (
                        <p className="text-xs text-muted-foreground py-2">Loading…</p>
                      ) : depts[faculty.id].length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No departments yet.</p>
                      ) : (
                        depts[faculty.id].map((dept) => (
                          <div key={dept.id} className="flex items-center justify-between py-1.5 pl-6">
                            <div>
                              <span className="text-sm text-foreground">{dept.name}</span>
                              {dept.shortCode && <span className="text-xs text-muted-foreground ml-2">({dept.shortCode})</span>}
                            </div>
                            <button
                              disabled={deletingId === dept.id}
                              onClick={() => deleteDepartment(faculty.id, dept.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modal === "faculty" && (
        <AddModal
          title="Add Faculty"
          fields={[{ label: "Faculty Name *", key: "name", required: true }]}
          onClose={() => setModal(null)}
          onSubmit={addFaculty}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {modal !== null && typeof modal === "object" && modal.type === "dept" && (
        <AddModal
          title="Add Department"
          fields={[
            { label: "Department Name *", key: "name",      required: true },
            { label: "Short Code",        key: "shortCode", required: false },
          ]}
          onClose={() => setModal(null)}
          onSubmit={(data) => addDepartment(modal.facultyId, data)}
          loading={modalLoading}
          error={modalError}
        />
      )}
    </div>
  );
}
