"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { ShieldCheck, Plus, Trash2, AlertCircle, X, PowerOff, Power, KeyRound } from "lucide-react";

interface Admin {
  id: string;
  fullName: string;
  email: string;
  isActive?: boolean;
  school?: { id: string; name: string; shortCode: string };
  createdAt: string;
}

interface School { id: string; name: string; shortCode: string }

function CreateAdminModal({
  schools, onClose, onCreated,
}: {
  schools: School[];
  onClose: () => void;
  onCreated: (a: Admin) => void;
}) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", schoolId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const created = await adminApi.createAdmin({
        fullName: form.fullName, email: form.email,
        password: form.password, schoolId: form.schoolId,
      });
      onCreated(created as Admin);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-foreground">Create School Admin</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        {error && (
          <div className="mb-4 bg-destructive/10 text-destructive rounded-xl p-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: "Full Name *", field: "fullName", type: "text" },
            { label: "Email *",     field: "email",    type: "email" },
            { label: "Password *",  field: "password", type: "password" },
          ].map(({ label, field, type }) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{label}</label>
              <input
                required type={type}
                value={(form as any)[field]}
                onChange={(e) => set(field, e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">School *</label>
            <select
              required
              value={form.schoolId}
              onChange={(e) => set("schoolId", e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select school…</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity">
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ adminId, onClose }: { adminId: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await adminApi.resetAdminPassword(adminId, password);
      setDone(true);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-foreground">Reset Password</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        {done ? (
          <p className="text-sm text-emerald-600 font-medium">Password reset successfully.</p>
        ) : (
          <>
            {error && (
              <div className="mb-4 bg-destructive/10 text-destructive rounded-xl p-3 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">New Password *</label>
                <input
                  required type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity">
                  {loading ? "Resetting…" : "Reset"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins]     = useState<Admin[]>([]);
  const [schools, setSchools]   = useState<School[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.getAdmins(), adminApi.getSchools()])
      .then(([a, s]: any) => {
        setAdmins(Array.isArray(a) ? a : []);
        setSchools(Array.isArray(s) ? s : []);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(admin: Admin) {
    setActionId(admin.id);
    try {
      if (admin.isActive !== false) {
        await adminApi.deactivateAdmin(admin.id);
        setAdmins((p) => p.map((a) => a.id === admin.id ? { ...a, isActive: false } : a));
      } else {
        await adminApi.reactivateAdmin(admin.id);
        setAdmins((p) => p.map((a) => a.id === admin.id ? { ...a, isActive: true } : a));
      }
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  async function deleteAdmin(id: string) {
    if (!confirm("Delete this admin?")) return;
    setActionId(id);
    try {
      await adminApi.deleteAdmin(id);
      setAdmins((p) => p.filter((a) => a.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setActionId(null); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">School Admins</h1>
          <p className="text-muted-foreground text-sm mt-1">{admins.length} admins</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Admin
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Admin</th>
                <th className="text-left px-4 py-3 font-medium">School</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse w-24" /></td>
                      ))}
                    </tr>
                  ))
                : admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{admin.fullName}</p>
                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {admin.school ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent text-accent-foreground">
                            {admin.school.shortCode}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {admin.isActive !== false
                          ? <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                          : <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Inactive</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            disabled={actionId === admin.id}
                            onClick={() => toggleActive(admin)}
                            title={admin.isActive !== false ? "Deactivate" : "Reactivate"}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              admin.isActive !== false
                                ? "hover:bg-amber-100 text-muted-foreground hover:text-amber-600"
                                : "hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600"
                            }`}
                          >
                            {admin.isActive !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setResetTarget(admin.id)}
                            title="Reset password"
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            disabled={actionId === admin.id}
                            onClick={() => deleteAdmin(admin.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {!loading && admins.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-10">No admins yet.</p>
        )}
      </div>

      {showCreate && (
        <CreateAdminModal
          schools={schools}
          onClose={() => setShowCreate(false)}
          onCreated={(a) => { setAdmins((p) => [a, ...p]); setShowCreate(false); }}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal adminId={resetTarget} onClose={() => setResetTarget(null)} />
      )}
    </div>
  );
}
