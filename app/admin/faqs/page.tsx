"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api/admin";
import {
  HelpCircle, Plus, Pencil, Trash2, AlertCircle, RefreshCw,
  ChevronDown, Loader2, X, CheckCircle2,
} from "lucide-react";

interface Faq {
  id:       string;
  question: string;
  answer:   string;
  category?: string;
  order?:   number;
}

interface FaqForm { question: string; answer: string; category: string; }
const EMPTY: FaqForm = { question: "", answer: "", category: "" };
const INPUT    = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const TEXTAREA = `${INPUT} resize-none`;

export default function AdminFaqsPage() {
  const [faqs, setFaqs]           = useState<Faq[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({});
  const [editId, setEditId]       = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState<FaqForm>(EMPTY);
  const [submitting, setSubmit]   = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDel]      = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminApi.getSchoolAdminFaqs();
      setFaqs(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm(EMPTY); setEditId(null); setFormError(null); setShowAdd(true); }

  function openEdit(faq: Faq) {
    setForm({ question: faq.question, answer: faq.answer, category: faq.category ?? "" });
    setEditId(faq.id);
    setFormError(null);
    setShowAdd(true);
  }

  async function handleSubmit() {
    if (!form.question.trim() || !form.answer.trim()) { setFormError("Question and answer are required."); return; }
    setSubmit(true); setFormError(null);
    try {
      const payload = { question: form.question.trim(), answer: form.answer.trim(), category: form.category.trim() || undefined };
      if (editId) {
        const updated = await adminApi.updateSchoolAdminFaq(editId, payload);
        setFaqs(p => p.map(f => f.id === editId ? { ...f, ...updated as Faq } : f));
      } else {
        const created = await adminApi.createSchoolAdminFaq(payload);
        setFaqs(p => [...p, created as Faq]);
      }
      setShowAdd(false);
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmit(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    setDel(id);
    try {
      await adminApi.deleteSchoolAdminFaq(id);
      setFaqs(p => p.filter(f => f.id !== id));
    } catch (e: any) { setError(e.message); }
    finally { setDel(null); }
  }

  // Group by category
  const groups = faqs.reduce<Record<string, Faq[]>>((acc, f) => {
    const key = f.category || "General";
    (acc[key] = acc[key] ?? []).push(f);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQs</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage frequently asked questions for your school</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-border hover:bg-accent disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card rounded-2xl p-4 h-14 animate-pulse" />)}
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <HelpCircle className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No FAQs yet. Add the first one!</p>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>
      ) : (
        Object.entries(groups).map(([category, items]) => (
          <div key={category} className="flex flex-col gap-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">{category}</h2>
            {items.map(faq => (
              <div key={faq.id} className="bg-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpanded(p => ({ ...p, [faq.id]: !p[faq.id] }))}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  <span className="flex-1 font-medium text-foreground text-sm">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded[faq.id] ? "rotate-180" : ""}`} />
                </button>

                {expanded[faq.id] && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{faq.answer}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(faq)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        disabled={deletingId === faq.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors disabled:opacity-50"
                      >
                        {deletingId === faq.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}

      {/* Add / Edit modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative bg-card rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">{editId ? "Edit FAQ" : "Add FAQ"}</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-destructive/10 text-destructive rounded-xl p-3 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Question *</label>
                <input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="What is…?" className={INPUT} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Answer *</label>
                <textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} rows={4} placeholder="The answer is…" className={TEXTAREA} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Registration, Accommodation" className={INPUT} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
