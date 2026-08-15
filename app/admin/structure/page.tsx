"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api/admin";
import { BookMarked, Building2, ChevronDown, ChevronRight, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

interface Faculty    { id: string; name: string }
interface Department { id: string; name: string; shortCode?: string }

export default function AdminStructurePage() {
  const [faculties, setFaculties]   = useState<Faculty[]>([]);
  const [depts, setDepts]           = useState<Record<string, Department[]>>({});
  const [expanded, setExpanded]     = useState<Record<string, boolean>>({});
  const [loading, setLoading]       = useState(true);
  const [deptLoading, setDeptLoad]  = useState<Record<string, boolean>>({});
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminApi.getSchoolAdminFaculties();
      setFaculties(Array.isArray(data) ? data : []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function toggle(faculty: Faculty) {
    const next = !expanded[faculty.id];
    setExpanded(p => ({ ...p, [faculty.id]: next }));
    if (next && !depts[faculty.id]) {
      setDeptLoad(p => ({ ...p, [faculty.id]: true }));
      try {
        const data = await adminApi.getSchoolAdminDepartments(faculty.id);
        setDepts(p => ({ ...p, [faculty.id]: Array.isArray(data) ? data : [] }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) { setError(e.message); }
      finally { setDeptLoad(p => ({ ...p, [faculty.id]: false })); }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faculties & Departments</h1>
          <p className="text-muted-foreground text-sm mt-1">Your school&apos;s academic structure (read-only)</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-card rounded-2xl p-4 h-14 animate-pulse" />)}
        </div>
      ) : faculties.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground text-sm">
          No faculties found for your school.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {faculties.map(faculty => (
            <div key={faculty.id} className="bg-card rounded-2xl overflow-hidden">
              <button
                onClick={() => toggle(faculty)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                {expanded[faculty.id]
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                }
                <BookMarked className="w-4 h-4 text-primary shrink-0" />
                <span className="flex-1 font-medium text-foreground text-sm">{faculty.name}</span>
                {depts[faculty.id] && (
                  <span className="text-xs text-muted-foreground shrink-0">{depts[faculty.id].length} dept{depts[faculty.id].length !== 1 ? "s" : ""}</span>
                )}
              </button>

              {expanded[faculty.id] && (
                <div className="border-t border-border px-4 py-2">
                  {deptLoading[faculty.id] ? (
                    <div className="flex items-center gap-2 py-3 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading departments…
                    </div>
                  ) : !depts[faculty.id] || depts[faculty.id].length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 pl-6">No departments.</p>
                  ) : (
                    depts[faculty.id].map(dept => (
                      <div key={dept.id} className="flex items-center gap-2 py-2 pl-6 border-b border-border last:border-0">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground flex-1">{dept.name}</span>
                        {dept.shortCode && (
                          <span className="text-xs text-muted-foreground bg-muted rounded-lg px-2 py-0.5">{dept.shortCode}</span>
                        )}
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
  );
}
