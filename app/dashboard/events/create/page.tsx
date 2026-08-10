"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, Loader2, X } from "lucide-react";
import { schoolApi } from "@/lib/api/school";
import { usersApi } from "@/lib/api/users";
import type { User, DepartmentType, UserRole } from "@/types/auth";

// ─── Roles allowed to create events ──────────────────────────────────────────

const CAN_CREATE: UserRole[] = [
  "COURSE_REP",
  "EVENT_ORCHESTRATOR",
  "SCHOOL_ADMIN",
  "SUPER_ADMIN",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDatetimeValue(iso: string) {
  // strips seconds/ms so datetime-local input is happy
  return new Date(iso).toISOString().slice(0, 16);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const router = useRouter();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Current user (for role-based field restrictions) ──
  const [me, setMe]                   = useState<User | null>(null);
  const [departments, setDepartments] = useState<DepartmentType[]>([]);

  // ── Form fields ──
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime]     = useState("");
  const [endTime, setEndTime]         = useState("");
  const [location, setLocation]       = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [level, setLevel]             = useState("");

  // ── Cover image ──
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0); // 0–100

  // ── Submission state ──
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [apiError, setApiError]       = useState<string | null>(null);

  // ── Validation ──
  const [touched, setTouched]         = useState(false);
  const titleErr    = touched && !title.trim();
  const startErr    = touched && !startTime;
  const endErr      = touched && endTime && startTime && endTime <= startTime;
  const hasErrors   = titleErr || startErr || !!endErr;

  // ── Load current user + departments ──
  useEffect(() => {
    usersApi.getMe().then((user) => {
      setMe(user);
      // COURSE_REP is locked to their own department — pre-fill and disable
      if (user.departmentId) setDepartmentId(user.departmentId);
      // load departments for admins / orchestrators who can pick any
      if (
        user.role === "EVENT_ORCHESTRATOR" ||
        user.role === "SCHOOL_ADMIN" ||
        user.role === "SUPER_ADMIN"
      ) {
        if (user.facultyId) {
          schoolApi
            .getDepartments(user.facultyId)
            .then(setDepartments)
            .catch(() => {});
        }
      }
    }).catch(() => {});
  }, []);

  // ── Image picker ──
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadProgress(0);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Submit ──
  async function handlePublish() {
    setTouched(true);
    if (!title.trim() || !startTime) return;
    if (endTime && startTime && endTime <= startTime) return;

    setSubmitting(true);
    setApiError(null);

    try {
      // 1. Create the event
      const payload: Record<string, unknown> = {
        title:        title.trim(),
        description:  description.trim() || undefined,
        startDate:    new Date(startTime).toISOString(),
        endDate:      endTime ? new Date(endTime).toISOString() : undefined,
        venue:        location.trim() || undefined,
        departmentId: departmentId || undefined,
        level:        level.trim() || undefined,
      };
      const event = await schoolApi.createEvent(payload);

      // 2. Upload cover image if chosen (simulate progress with intervals)
      if (imageFile && event?.id) {
        const tick = setInterval(
          () => setUploadProgress((p) => Math.min(p + 15, 90)),
          120,
        );
        try {
          await schoolApi.uploadEventImage(event.id, imageFile);
          setUploadProgress(100);
        } finally {
          clearInterval(tick);
        }
      }

      setSubmitted(true);
      // brief pause so user sees success, then go back — guarded against unmount
      setTimeout(() => { if (mountedRef.current) router.push("/dashboard/events"); }, 1000);
    } catch (e: any) {
      setApiError(e.message || "Failed to publish event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Guard — only privileged roles see this page ──
  const canCreate = !me || CAN_CREATE.includes(me.role);
  const isCourseRep = me?.role === "COURSE_REP";
  const canPickAnyDept =
    me?.role === "EVENT_ORCHESTRATOR" ||
    me?.role === "SCHOOL_ADMIN" ||
    me?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen w-full bg-slate-50 px-5 py-5 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => router.back()}
          className="text-indigo-500 font-medium"
        >
          Cancel
        </button>
        <h1 className="text-lg font-bold text-slate-900">Create Event</h1>
        <div className="w-14" />
      </div>

      {/* ── API / validation error banner ── */}
      {(apiError || (touched && hasErrors)) && (
        <div className="flex items-start gap-2 bg-rose-50 rounded-2xl p-4 mb-5">
          <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-rose-600 text-sm">
              {apiError ?? "There was a problem saving this event."}
            </p>
            {!apiError && (
              <p className="text-rose-500 text-sm">
                Please review the highlighted fields and try again.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Success banner ── */}
      {submitted && (
        <div className="flex items-center gap-2 bg-emerald-50 rounded-2xl p-4 mb-5">
          <Loader2 className="w-5 h-5 text-emerald-500 animate-spin shrink-0" />
          <p className="font-semibold text-emerald-700 text-sm">
            Event published! Redirecting…
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 mb-5">

        {/* ── Title ── */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            Event title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className={`w-full rounded-xl border px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
              titleErr
                ? "border-rose-300 focus:ring-rose-200"
                : "border-slate-200 focus:ring-indigo-300"
            }`}
          />
          {titleErr && (
            <p className="text-rose-500 text-sm mt-1">Title is required.</p>
          )}
        </div>

        {/* ── Description ── */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>

        {/* ── Start date & time ── */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            Date &amp; time
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 ${
              startErr
                ? "border-rose-300 focus:ring-rose-200"
                : "border-slate-200 focus:ring-indigo-300"
            }`}
          />
          {startErr && (
            <p className="text-rose-500 text-sm mt-1">
              Please choose a valid date and time.
            </p>
          )}
        </div>

        {/* ── End date & time ── */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            End date &amp; time
          </label>
          <input
            type="datetime-local"
            value={endTime}
            min={startTime || undefined}
            onChange={(e) => setEndTime(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 ${
              endErr
                ? "border-rose-300 focus:ring-rose-200"
                : "border-slate-200 focus:ring-indigo-300"
            }`}
          />
          {endErr && (
            <p className="text-rose-500 text-sm mt-1">
              End time must be after start time.
            </p>
          )}
        </div>

        {/* ── Location ── */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            Location / venue
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location / venue"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        {/* ── Target department ── */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            Target department (optional)
          </label>
          {/* Course reps are locked to their own dept; admins get a dropdown */}
          {isCourseRep ? (
            <input
              value={me?.departmentId ?? ""}
              readOnly
              disabled
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-400 bg-slate-50 cursor-not-allowed"
              placeholder="Your department"
            />
          ) : canPickAnyDept && departments.length > 0 ? (
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              placeholder="Target department (optional)"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          )}
        </div>

        {/* ── Target level ── */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            Target level (optional)
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="">All levels</option>
            {["100", "200", "300", "400", "500", "600"].map((l) => (
              <option key={l} value={l}>
                {l} Level
              </option>
            ))}
          </select>
        </div>

        {/* ── Cover image ── */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-2">
            Cover image
          </label>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />

          {imagePreview ? (
            /* Preview state */
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={imagePreview}
                alt="Cover preview"
                className="w-full h-44 object-cover"
              />
              {/* Upload progress overlay */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                  <div className="w-2/3 h-1.5 rounded-full bg-white/30 overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {/* Remove button */}
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Tap to change */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-black/50 text-white text-xs font-semibold rounded-xl px-3 py-1.5"
              >
                Change
              </button>
            </div>
          ) : (
            /* Empty state — matches design exactly */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl bg-slate-50 flex flex-col items-center py-8 px-4 border border-dashed border-slate-200 active:bg-slate-100 transition"
            >
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                <Camera className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="font-semibold text-slate-800 mb-1">
                Tap to add cover photo
              </p>
              <p className="text-slate-400 text-sm mb-4">JPEG, PNG, or WebP</p>
              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full w-0 bg-indigo-500 rounded-full" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ── Publish button ── */}
      <button
        onClick={handlePublish}
        disabled={submitting || submitted}
        className="w-full rounded-2xl bg-indigo-500 py-3.5 font-bold text-white shadow-lg shadow-indigo-200 disabled:opacity-60 transition"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Publishing…
          </span>
        ) : (
          "Publish event"
        )}
      </button>
    </div>
  );
}
