"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Lock, Users, ChevronDown, Loader2, AlertTriangle } from "lucide-react";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupType = "EXAM_PREP" | "ASSIGNMENT" | "TUTORIAL" | "PROJECT" | "GENERAL";

interface CreateGroupForm {
  name:        string;
  description: string;
  type:        GroupType;
  courseTag:   string;
  department:  string;
  isPrivate:   boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPES: { value: GroupType; label: string }[] = [
  { value: "EXAM_PREP",  label: "Exam Prep" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "TUTORIAL",   label: "Tutorial" },
  { value: "PROJECT",    label: "Project" },
  { value: "GENERAL",    label: "General" },
];

const DEPARTMENTS = [
  "Computer Science", "Mathematics", "Physics", "Chemistry",
  "Biology", "Engineering", "Economics", "Law", "Medicine", "Other",
];

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors shrink-0 ${
        checked ? "bg-primary justify-end" : "bg-muted justify-start"
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-card shadow-sm" />
    </button>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const INPUT_CLS = "w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
      {error && (
        <p className="text-destructive text-xs flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Live preview card ────────────────────────────────────────────────────────

function PreviewCard({
  form,
}: {
  form: CreateGroupForm;
}) {
  const typeLabel = TYPES.find(t => t.value === form.type)?.label ?? form.type;
  return (
    <div className="rounded-2xl border border-border bg-muted p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-foreground text-sm">Study Group Preview</p>
          <p className="text-muted-foreground text-xs">Live card preview as you type</p>
        </div>
        <span className="text-xs font-bold bg-card rounded-full px-3 py-1 text-muted-foreground shrink-0">
          {typeLabel}
        </span>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-bold text-foreground text-base leading-snug mb-2">
            <span className="truncate">{form.name || "Group name"}</span>
            {form.isPrivate && <Lock className="w-4 h-4 text-muted-foreground shrink-0" />}
          </p>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold bg-muted rounded-lg px-2 py-1 text-muted-foreground">
              {typeLabel}
            </span>
            {form.isPrivate && (
              <span className="text-xs font-bold bg-muted rounded-lg px-2 py-1 text-muted-foreground">
                Private
              </span>
            )}
            {form.courseTag && (
              <span className="text-xs font-bold bg-accent rounded-lg px-2 py-1 text-primary">
                {form.courseTag}
              </span>
            )}
          </div>
          {form.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">{form.description}</p>
          )}
        </div>
        <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateStudyGroupPage() {
  const router = useRouter();

  const [form, setForm] = useState<CreateGroupForm>({
    name:        "",
    description: "",
    type:        "GENERAL",
    courseTag:   "",
    department:  "",
    isPrivate:   true,
  });

  const [touched, setTouched]         = useState<Partial<Record<keyof CreateGroupForm, boolean>>>({});
  const [deptOpen, setDeptOpen]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ── field helpers ───────────────────────────────────────────────────────────

  function setF<K extends keyof CreateGroupForm>(k: K, v: CreateGroupForm[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setGlobalError(null);
  }
  function touch(k: keyof CreateGroupForm) {
    setTouched(p => ({ ...p, [k]: true }));
  }

  const nameError = touched.name && !form.name.trim()
    ? "Group name is required"
    : undefined;

  // ── submit ───────────────────────────────────────────────────────────────────

  async function handleCreate() {
    setTouched({ name: true });
    if (!form.name.trim()) return;

    setSubmitting(true);
    setGlobalError(null);
    try {
      const data = await communityApi.createGroup({
        name:        form.name.trim(),
        description: form.description.trim(),
        type:        form.type,
        courseTag:   form.courseTag.trim() || undefined,
        department:  form.department || undefined,
        isPrivate:   form.isPrivate,
      }) as { id?: string };
      // Navigate to the new group's chat
      const newId = data?.id;
      router.push(
        newId
          ? `/dashboard/community/groups/${newId}/chat`
          : "/dashboard/community/groups"
      );
    } catch (e: unknown) {
      setGlobalError(e instanceof Error ? e.message : "Failed to create group. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* Bottom-sheet overlay */
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="w-full max-w-md bg-card rounded-t-3xl max-h-[92vh] overflow-y-auto">

        {/* ── Handle + close ── */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 sticky top-0 bg-card z-10">
          <div className="w-10 h-1.5 rounded-full bg-muted mx-auto" />
          <button
            onClick={() => router.back()}
            aria-label="Close"
            className="absolute right-6 top-4"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-2">

          {/* ── Title ── */}
          <h2 className="text-xl font-bold text-foreground mb-5">Create Study Group</h2>

          {/* ── Global error ── */}
          {globalError && (
            <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{globalError}</p>
            </div>
          )}

          {/* ── Live preview ── */}
          <PreviewCard form={form} />

          {/* ── Group name ── */}
          <Field label="Group name *" error={nameError}>
            <input
              value={form.name}
              onChange={e => setF("name", e.target.value)}
              onBlur={() => touch("name")}
              placeholder="e.g. Quantum Calculus Crew"
              className={`${INPUT_CLS} ${nameError ? "border-destructive focus:ring-destructive/30" : ""}`}
            />
          </Field>

          {/* ── Description ── */}
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => setF("description", e.target.value)}
              rows={3}
              placeholder="What's this group for?"
              className={`${INPUT_CLS} resize-none`}
            />
          </Field>

          {/* ── Type chips ── */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-foreground block mb-2">Type</label>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setF("type", value)}
                  className={`text-sm font-bold rounded-xl py-3 transition-colors ${
                    form.type === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Course tag ── */}
          <Field label="Course tag">
            <input
              value={form.courseTag}
              onChange={e => setF("courseTag", e.target.value)}
              placeholder="e.g. MATH 241"
              className={INPUT_CLS}
            />
          </Field>

          {/* ── Department picker ── */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-foreground block mb-1.5">Department</label>
            <button
              type="button"
              onClick={() => setDeptOpen(v => !v)}
              className="w-full flex items-center justify-between rounded-xl bg-muted border border-border px-4 py-3 text-sm"
            >
              <span className={form.department ? "text-foreground" : "text-muted-foreground"}>
                {form.department || "Select department"}
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${deptOpen ? "rotate-180" : ""}`} />
            </button>
            {deptOpen && (
              <div className="mt-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept}
                    onClick={() => { setF("department", dept); setDeptOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-muted ${
                      form.department === dept
                        ? "font-bold text-primary bg-accent"
                        : "text-foreground"
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Private toggle ── */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-muted p-4 mb-6">
            <div>
              <p className="font-bold text-foreground">Private group</p>
              <p className="text-muted-foreground text-sm">Only invited members can join</p>
            </div>
            <Toggle checked={form.isPrivate} onChange={() => setF("isPrivate", !form.isPrivate)} />
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 rounded-2xl border border-border bg-card py-3.5 font-bold text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-opacity"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Creating…" : "Create group"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
