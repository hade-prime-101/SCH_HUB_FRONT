"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Paperclip,
  X,
  Grid2x2,
  Ghost,
  AlertCircle,
  File,
  Image as ImageIcon,
  Link2,
  Loader2,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";
import { schoolApi } from "@/lib/api/school";
import { useAuth } from "@/lib/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "NOTICE_BOARD"
  | "LOUNGE"
  | "DEPT_UPDATES"
  | "CROSS_LEVEL"
  | "QNA"
  | "STUDY_GROUPS"
  | "FRESHERS_CORNER"
  | "ANONYMOUS"
  | "CAMPUS_CULTURE";

interface AttachedFile {
  name: string;
  meta: string;
  type: "file" | "image" | "link";
  url?: string;   // for links
  file?: File;    // for actual files (uploaded later or sent as name)
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTIONS: { label: string; value: Section }[] = [
  { label: "Notice Board",    value: "NOTICE_BOARD" },
  { label: "Lounge",          value: "LOUNGE" },
  { label: "Dept Updates",    value: "DEPT_UPDATES" },
  { label: "Cross Level",     value: "CROSS_LEVEL" },
  { label: "Q&A",             value: "QNA" },
  { label: "Study Groups",    value: "STUDY_GROUPS" },
  { label: "Freshers Corner", value: "FRESHERS_CORNER" },
  { label: "Anonymous",       value: "ANONYMOUS" },
  { label: "Campus Culture",  value: "CAMPUS_CULTURE" },
];

const MAX_CONTENT = 5000;
const MAX_FILES   = 5;

// ─── Link Modal ───────────────────────────────────────────────────────────────

function LinkModal({ onAdd, onClose }: { onAdd: (url: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Add a link</h2>
          <button onClick={onClose} className="text-muted-foreground" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          type="url"
          className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => { if (url.trim()) { onAdd(url.trim()); onClose(); } }}
          disabled={!url.trim()}
          className="w-full rounded-2xl bg-primary text-primary-foreground font-semibold py-3 disabled:opacity-60 transition"
        >
          Add Link
        </button>
      </div>
    </div>
  );
}

// ─── Attached File Row ────────────────────────────────────────────────────────

function FileRow({ file, onRemove }: { file: AttachedFile; onRemove: (name: string) => void }) {
  const Icon = file.type === "image" ? ImageIcon : file.type === "link" ? Link2 : File;
  return (
    <div className="flex items-center justify-between border border-border rounded-2xl px-4 py-3 bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{file.name}</p>
          <p className="text-muted-foreground text-sm">{file.meta}</p>
        </div>
      </div>
      <button onClick={() => onRemove(file.name)} aria-label={`Remove ${file.name}`} className="ml-3 shrink-0">
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreatePostPage() {
  const router   = useRouter();
  const { user } = useAuth();

  const [section,    setSection]    = useState<Section>("DEPT_UPDATES");
  const [content,    setContent]    = useState("");
  const [anonymous,  setAnonymous]  = useState(false);
  const [courseTag,  setCourseTag]  = useState("");
  const [expiresAt,  setExpiresAt]  = useState("");
  const [department, setDepartment] = useState("");
  const [level,      setLevel]      = useState("");
  const [files,      setFiles]      = useState<AttachedFile[]>([]);
  const [errors,     setErrors]     = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSectionPanel, setShowSectionPanel] = useState(false);
  const [showLinkModal,    setShowLinkModal]     = useState(false);

  // Department loading
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill department from user profile
  useEffect(() => {
    if (user?.departmentId) setDepartment(user.departmentId);
  }, [user]);

  // Load departments for the user's faculty
  useEffect(() => {
    if (!user?.facultyId) return;
    setDeptLoading(true);
    schoolApi.getDepartments(user.facultyId)
      .then(data => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setDeptLoading(false));
  }, [user?.facultyId]);

  // ── helpers ──

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  function addLink(url: string) {
    if (files.length >= MAX_FILES) return;
    setFiles(prev => [...prev, { name: url, meta: "Link", type: "link", url }]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    picked.forEach(f => {
      if (files.length >= MAX_FILES) return;
      const isImg = f.type.startsWith("image/");
      setFiles(prev => [
        ...prev,
        {
          name: f.name,
          meta: isImg ? "Image" : `${f.type.split("/")[1]?.toUpperCase() ?? "File"} · ${(f.size / 1024 / 1024).toFixed(1)} MB`,
          type: isImg ? "image" : "file",
          file: f,
        },
      ]);
    });
    e.target.value = "";
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!content.trim())              errs.push("Content is required.");
    if (content.length > MAX_CONTENT) errs.push(`Content must be under ${MAX_CONTENT} characters.`);
    if (files.length > MAX_FILES)     errs.push(`You can attach at most ${MAX_FILES} files.`);
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);
    try {
      // Build attachments as [{ url, name }] objects (backend shape)
      // Links carry their URL directly; file entries use the filename as the
      // name field with an empty url — a real upload URL would replace this
      // if the files were pre-uploaded before posting.
      const attachments = files.length > 0
        ? files.map(f => ({
            url:  f.url ?? f.name,   // links: real URL; files: filename placeholder
            name: f.name,
          }))
        : undefined;

      // Convert datetime-local to full ISO string for backend
      const expiresAtISO = expiresAt
        ? new Date(expiresAt).toISOString()
        : undefined;

      await communityApi.createPost({
        content:      content.trim(),
        section,
        scope:        department ? "DEPARTMENT" : "UNIVERSITY",
        priority:     "GENERAL",
        isAnonymous:  anonymous,
        courseTag:    courseTag.trim().toUpperCase() || undefined,
        expiresAt:    expiresAtISO,
        departmentId: department || undefined,
        targetLevel:  level || undefined,
        attachments:  attachments ?? undefined,
      });
      router.push("/dashboard/community");
    } catch (e: any) {
      setErrors([e.message || "Failed to post. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background px-6 py-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-muted-foreground font-medium">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-4 py-2 font-semibold text-sm disabled:opacity-50 transition"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>

      {/* Section chips */}
      <div className="flex gap-2 overflow-x-auto mb-5 pb-1 scrollbar-none">
        {SECTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => setSection(s.value)}
            className={`shrink-0 text-xs font-bold tracking-wide px-4 py-2.5 rounded-full border transition ${
              section === s.value
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-ring"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content textarea */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value.slice(0, MAX_CONTENT))}
        placeholder="What's on your mind?"
        rows={6}
        className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      <p className="text-right text-muted-foreground text-sm mt-2 mb-5">
        {content.length} / {MAX_CONTENT}
      </p>

      {/* Attach dashed trigger */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-between border-2 border-dashed border-border rounded-2xl px-4 py-4 mb-4 transition hover:border-ring"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <Paperclip className="w-4 h-4" /> Attach files or links
        </span>
        <span className="text-muted-foreground text-sm">{files.length} / {MAX_FILES}</span>
      </button>
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

      {/* Attached files */}
      {files.length > 0 && (
        <div className="flex flex-col gap-3 mb-5">
          {files.map(f => <FileRow key={f.name} file={f} onRemove={removeFile} />)}
        </div>
      )}

      {/* Action chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setShowSectionPanel(v => !v)}
          className={`flex items-center gap-2 rounded-full px-4 py-2.5 font-medium text-sm border transition ${
            showSectionPanel ? "bg-foreground text-background border-foreground" : "border-border text-foreground hover:border-ring"
          }`}
        >
          <Grid2x2 className="w-4 h-4" /> Section
        </button>
        <button
          onClick={() => files.length < MAX_FILES && fileInputRef.current?.click()}
          disabled={files.length >= MAX_FILES}
          className="flex items-center gap-2 border border-border rounded-full px-4 py-2.5 text-foreground font-medium text-sm transition hover:border-ring disabled:opacity-40"
        >
          <Paperclip className="w-4 h-4" /> Attach
        </button>
        <button
          onClick={() => files.length < MAX_FILES && setShowLinkModal(true)}
          disabled={files.length >= MAX_FILES}
          className="flex items-center gap-2 border border-border rounded-full px-4 py-2.5 text-foreground font-medium text-sm transition hover:border-ring disabled:opacity-40"
        >
          <Link2 className="w-4 h-4" /> Link
        </button>
        <button
          onClick={() => setAnonymous(v => !v)}
          className={`flex items-center gap-2 rounded-full px-4 py-2.5 font-medium text-sm border transition ${
            anonymous ? "bg-foreground text-background border-foreground" : "border-border text-foreground hover:border-ring"
          }`}
        >
          <Ghost className="w-4 h-4" /> Anonymous
        </button>
      </div>

      {/* Section dropdown panel */}
      {showSectionPanel && (
        <div className="border border-border rounded-2xl p-4 mb-5 bg-card">
          <p className="text-xs font-bold text-muted-foreground tracking-widest mb-3">SELECT SECTION</p>
          <div className="flex gap-2 flex-wrap">
            {SECTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => { setSection(s.value); setShowSectionPanel(false); }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                  section === s.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-ring"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Course tag */}
      <div className="border-t border-border pt-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="font-semibold text-foreground" htmlFor="p-course">Course tag</label>
          <span className="text-sm text-muted-foreground">Optional</span>
        </div>
        <div className="flex items-center rounded-xl border border-border bg-muted px-4 focus-within:ring-2 focus-within:ring-ring">
          <span className="text-muted-foreground text-sm shrink-0 mr-2">#</span>
          <input
            id="p-course"
            value={courseTag}
            onChange={e => setCourseTag(e.target.value)}
            placeholder="e.g. CSC301"
            className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none uppercase"
          />
        </div>
      </div>

      {/* Auto-expire */}
      <div className="mb-5">
        <label className="font-semibold text-foreground block mb-2" htmlFor="p-expire">
          Auto-expire post <span className="text-muted-foreground text-sm font-normal">— optional</span>
        </label>
        <input
          id="p-expire"
          type="datetime-local"
          value={expiresAt}
          onChange={e => setExpiresAt(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Department / Level */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="font-semibold text-foreground block mb-2" htmlFor="p-dept">Department</label>
          <select
            id="p-dept"
            value={department}
            onChange={e => setDepartment(e.target.value)}
            disabled={deptLoading}
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          >
            <option value="">All departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {deptLoading && <p className="text-xs text-muted-foreground mt-1">Loading…</p>}
        </div>
        <div>
          <label className="font-semibold text-foreground block mb-2" htmlFor="p-level">Level</label>
          <select
            id="p-level"
            value={level}
            onChange={e => setLevel(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All levels</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
            <option value="400">400</option>
            <option value="500">500</option>
            <option value="600">600</option>
          </select>
        </div>
      </div>

      {/* Error summary */}
      {errors.length > 0 && (
        <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-2xl p-4 mb-5">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Please fix the following</p>
            <ul className="mt-1 list-disc list-inside">
              {errors.map(err => <li key={err} className="text-sm">{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !content.trim()}
        className="w-full rounded-2xl bg-primary text-primary-foreground font-semibold py-4 flex items-center justify-center gap-2 disabled:opacity-60 transition active:scale-95"
      >
        {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
        {submitting ? "Posting…" : "Post"}
      </button>

      {showLinkModal && <LinkModal onAdd={addLink} onClose={() => setShowLinkModal(false)} />}
    </div>
  );
}
