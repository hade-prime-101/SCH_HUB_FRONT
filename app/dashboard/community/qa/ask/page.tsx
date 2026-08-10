"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Paperclip,
  Link2,
  X,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { communityApi } from "@/lib/api/community";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType =
  | "COURSE_HELP"
  | "ASSIGNMENT_HELP"
  | "CONCEPT_EXPLANATION"
  | "EXAM_PREP"
  | "PROJECT_GUIDANCE";

interface Attachment {
  name: string;
  url:  string;   // for links: the URL itself; for files: the filename as a name-only ref
  isLink: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPES: QuestionType[] = [
  "COURSE_HELP",
  "ASSIGNMENT_HELP",
  "CONCEPT_EXPLANATION",
  "EXAM_PREP",
  "PROJECT_GUIDANCE",
];

const TYPE_LABEL: Record<QuestionType, string> = {
  COURSE_HELP:          "Course Help",
  ASSIGNMENT_HELP:      "Assignment Help",
  CONCEPT_EXPLANATION:  "Concept Explanation",
  EXAM_PREP:            "Exam Prep",
  PROJECT_GUIDANCE:     "Project Guidance",
};

const MAX_TITLE   = 300;
const MAX_CONTENT = 5000;
const MAX_FILES   = 5;

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors shrink-0 ${
        checked ? "bg-foreground justify-end" : "bg-border justify-start"
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-background shadow-sm transition-transform" />
    </button>
  );
}

// ─── Link input modal ─────────────────────────────────────────────────────────

function LinkModal({
  onAdd,
  onClose,
}: {
  onAdd: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Add a link</h2>
          <button onClick={onClose} className="text-muted-foreground">
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
          className="w-full rounded-2xl bg-primary text-primary-foreground font-semibold py-3 disabled:opacity-60"
        >
          Add Link
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AskQuestionPage() {
  const router = useRouter();

  const [title, setTitle]             = useState("");
  const [content, setContent]         = useState("");
  const [type, setType]               = useState<QuestionType>("COURSE_HELP");
  const [courseTag, setCourseTag]     = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isMentorQuestion, setIsMentorQuestion] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showTypePanel, setShowTypePanel] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function validate(): string[] {
    const errs: string[] = [];
    if (title.trim().length < 5)  errs.push("Title must be at least 5 characters.");
    if (!courseTag.trim())         errs.push("Course tag is required.");
    if (title.length > MAX_TITLE)  errs.push(`Title must be under ${MAX_TITLE} characters.`);
    if (content.length > MAX_CONTENT) errs.push(`Details must be under ${MAX_CONTENT} characters.`);
    return errs;
  }

  function addFileAttachment(name: string) {
    if (attachments.length >= MAX_FILES) return;
    // Backend expects { url, name } — for file attachments use the filename as url
    // (the actual upload URL would be set here if files were uploaded first)
    setAttachments((prev) => [...prev, { name, url: name, isLink: false }]);
  }

  function addLinkAttachment(url: string) {
    if (attachments.length >= MAX_FILES) return;
    setAttachments((prev) => [...prev, { name: url, url, isLink: true }]);
  }

  function removeAttachment(name: string) {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => addFileAttachment(f.name));
    e.target.value = "";
  }

  async function handleSubmit() {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);
    try {
      await communityApi.createQuestion({
        title:            title.trim(),
        content:          content.trim(),
        type,
        courseTag:        courseTag.trim().toUpperCase(),
        isAnonymous,
        isMentorQuestion,
        // Backend expects [{ url, name, size?, mimeType? }] — send the object shape
        attachments:      attachments.map((a) => ({ url: a.url, name: a.name })),
      });
      router.push("/dashboard/community/qa");
    } catch (e: any) {
      setErrors([e.message || "Failed to post question. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background px-6 py-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-4 py-2 font-semibold text-sm disabled:opacity-60 transition"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Ask a Question</h1>
        <p className="text-muted-foreground mt-1">Compose a question for SCH Hub</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Title */}
        <div className="border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-foreground" htmlFor="q-title">
              Title
            </label>
            <span className="text-xs font-bold text-destructive">Required</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {title.length} / {MAX_TITLE} characters
          </p>
          <input
            id="q-title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
            placeholder="Question title"
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Details */}
        <div className="border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold text-foreground" htmlFor="q-content">
              Details
            </label>
            <span className="text-xs text-muted-foreground">
              {content.length} / {MAX_CONTENT} characters
            </span>
          </div>
          <textarea
            id="q-content"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
            placeholder="Describe your question in detail"
            rows={4}
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Type */}
        <div className="border border-border rounded-2xl p-5">
          <button
            onClick={() => setShowTypePanel((v) => !v)}
            className="w-full flex items-center justify-between mb-4"
            aria-expanded={showTypePanel}
          >
            <span className="font-semibold text-foreground">Type</span>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-transform ${
                showTypePanel ? "rotate-180" : ""
              }`}
            />
          </button>
          {showTypePanel && (
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`text-xs font-bold tracking-wide px-3 py-2 rounded-lg border transition ${
                    type === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-ring"
                  }`}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          )}
          {!showTypePanel && (
            <p className="text-sm text-muted-foreground">{TYPE_LABEL[type]}</p>
          )}
        </div>

        {/* Course tag */}
        <div className="border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold text-foreground" htmlFor="q-course">
              Course tag
            </label>
            <span className="text-xs font-bold text-destructive">Required</span>
          </div>
          <div className="flex items-center rounded-xl border border-border bg-muted px-4 focus-within:ring-2 focus-within:ring-ring">
            <span className="text-muted-foreground text-sm shrink-0 mr-2"># course</span>
            <input
              id="q-course"
              value={courseTag}
              onChange={(e) => setCourseTag(e.target.value)}
              placeholder="e.g. MTH201"
              className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none uppercase"
            />
          </div>
        </div>

        {/* Ask anonymously */}
        <div className="border border-border rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Ask anonymously</p>
            <p className="text-sm text-muted-foreground">Hide your identity from peers</p>
          </div>
          <Toggle
            id="toggle-anon"
            checked={isAnonymous}
            onChange={() => setIsAnonymous((v) => !v)}
          />
        </div>

        {/* Route to mentor */}
        <div className="border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-foreground">Route to a mentor</p>
              <p className="text-sm text-muted-foreground">
                Notify a registered mentor for this course
              </p>
            </div>
            <Toggle
              id="toggle-mentor"
              checked={isMentorQuestion}
              onChange={() => setIsMentorQuestion((v) => !v)}
            />
          </div>
          {isMentorQuestion && (
            <div className="flex items-start gap-2 bg-muted rounded-xl p-3 mt-1">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Your question will be routed to a registered course mentor.
              </p>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold text-foreground">Attachments</label>
            <span className="text-xs text-muted-foreground">
              {attachments.length} / {MAX_FILES}
            </span>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {attachments.map((a) => (
                <div key={a.name} className="flex items-center gap-2 text-foreground">
                  {a.isLink ? (
                    <Link2 className="w-4 h-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Paperclip className="w-4 h-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex-1 text-sm truncate">{a.name}</span>
                  <button
                    onClick={() => removeAttachment(a.name)}
                    aria-label="Remove attachment"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {attachments.length < MAX_FILES && (
            <div className="flex gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <Paperclip className="w-4 h-4" /> Attach file
              </button>
              <button
                onClick={() => setShowLinkModal(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <Link2 className="w-4 h-4" /> Add link
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Error summary */}
        {errors.length > 0 && (
          <div className="flex items-start gap-2 text-destructive bg-destructive/10 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Please fix the highlighted fields</p>
              <ul className="mt-1 list-disc list-inside">
                {errors.map((e) => (
                  <li key={e} className="text-sm">{e}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-2xl bg-primary text-primary-foreground font-semibold py-4 flex items-center justify-center gap-2 disabled:opacity-60 transition active:scale-95"
        >
          {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {submitting ? "Posting…" : "Post Question"}
        </button>
      </div>

      {/* Link modal */}
      {showLinkModal && (
        <LinkModal
          onAdd={addLinkAttachment}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  );
}
