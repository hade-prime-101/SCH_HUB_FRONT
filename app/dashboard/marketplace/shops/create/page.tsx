"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  HelpCircle,
  Loader2,
  UploadCloud,
  Store,
  AlertTriangle,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopForm {
  name:    string;
  about:   string;
  active:  boolean;
  logoUrl: string | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors shrink-0 ${
        checked ? "bg-foreground justify-end" : "bg-border justify-start"
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-card shadow-sm" />
    </button>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-semibold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateShopPage() {
  const router = useRouter();

  const [form, setForm] = useState<ShopForm>({
    name:    "",
    about:   "",
    active:  true,
    logoUrl: null,
  });

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── field helpers ────────────────────────────────────────────────────────────

  function set<K extends keyof ShopForm>(key: K, value: ShopForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  // ── logo upload (simulated progress — replace with real upload endpoint) ─────

  const handleLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate type and size
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Logo must be under 5 MB.");
        return;
      }

      // Simulate upload progress
      setUploadProgress(0);
      const objectUrl = URL.createObjectURL(file);
      let progress    = 0;
      const interval  = setInterval(() => {
        progress += Math.floor(Math.random() * 18) + 8;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadProgress(null);
          set("logoUrl", objectUrl);
        } else {
          setUploadProgress(progress);
        }
      }, 120);
    },
    [],
  );

  // ── submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError("Shop name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await marketplaceApi.createShop({
        name:     form.name.trim(),
        about:    form.about.trim(),
        isActive: form.active,
        ...(form.logoUrl ? { logoUrl: form.logoUrl } : {}),
      });
      router.push("/dashboard/marketplace/shops");
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to create shop. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const uploading = uploadProgress !== null;
  const canSubmit = form.name.trim().length > 0 && !uploading && !submitting;

  return (
    <div className="min-h-screen w-full bg-muted flex items-start justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.back()}
              aria-label="Close"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Create Shop</h1>
              <p className="text-muted-foreground text-sm">Set up your campus storefront</p>
            </div>
          </div>
          <button
            className="flex items-center gap-1.5 border border-border rounded-xl px-3 py-2 text-foreground font-medium text-sm shrink-0"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" /> Help
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">

          {/* ── Error banner ── */}
          {error && (
            <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* ── Live preview ── */}
          <div className="rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-foreground">Your shop</p>
                <p className="text-muted-foreground text-sm">Live preview</p>
              </div>
              <span className="text-xs font-semibold bg-muted rounded-full px-3 py-1 text-muted-foreground">
                Preview
              </span>
            </div>
            <div className="rounded-xl bg-muted border border-border p-4 flex gap-3">
              {/* Logo preview */}
              <div className="relative w-14 h-14 rounded-full bg-border shrink-0 overflow-hidden flex items-center justify-center">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Shop logo"
                    className="w-full h-full object-cover"
                  />
                ) : uploading ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                ) : (
                  <Store className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">
                  {form.name || "Your shop name"}
                </p>
                {form.about && (
                  <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
                    {form.about}
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                  <Store className="w-3.5 h-3.5" />
                  {form.active ? "Active now" : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Shop logo ── */}
          <Field label="Shop logo" hint="PNG or JPG, max 5 MB">
            <div className="flex items-center gap-4">
              {/* Avatar / upload trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center shrink-0 overflow-hidden hover:border-primary transition-colors"
                aria-label="Upload shop logo"
              >
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UploadCloud className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />

              {/* Progress / prompt */}
              <div className="flex-1 min-w-0">
                {uploading ? (
                  <>
                    <p className="font-semibold text-foreground">Uploading…</p>
                    <p className="text-muted-foreground text-sm mb-2">
                      {uploadProgress}%
                    </p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-foreground rounded-full transition-[width] duration-100"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </>
                ) : form.logoUrl ? (
                  <>
                    <p className="font-semibold text-foreground">Logo uploaded</p>
                    <button
                      type="button"
                      onClick={() => { set("logoUrl", null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-destructive text-sm font-medium mt-0.5"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-foreground">Add a logo</p>
                    <p className="text-muted-foreground text-sm">
                      Tap the circle to upload
                    </p>
                  </>
                )}
              </div>
            </div>
          </Field>

          {/* ── Shop name ── */}
          <Field label="Shop name">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. CampusCore Shop"
              maxLength={60}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          {/* ── About ── */}
          <Field label="About your shop" hint={`${form.about.length}/200 characters`}>
            <textarea
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Describe what you sell…"
              rows={3}
              maxLength={200}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </Field>

          {/* ── Active toggle ── */}
          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div>
              <p className="font-bold text-foreground">Shop is active</p>
              <p className="text-muted-foreground text-sm">
                Visible to students on the marketplace
              </p>
            </div>
            <Toggle
              checked={form.active}
              onChange={() => set("active", !form.active)}
              label="Toggle shop active state"
            />
          </div>

          {/* ── Final preview card ── */}
          <div className="rounded-2xl border border-border p-4">
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">
              Your Shop
            </p>
            <div className="flex gap-3">
              <div className="w-14 h-14 rounded-full bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  : <Store className="w-6 h-6 text-muted-foreground" />
                }
              </div>
              <div className="min-w-0">
                <p className="font-bold text-lg text-foreground">
                  {form.name || "Your shop name"}
                </p>
                {form.about && (
                  <p className="text-muted-foreground line-clamp-3">{form.about}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 rounded-2xl border border-border py-3.5 font-bold text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 rounded-2xl bg-foreground py-3.5 font-bold text-card flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Creating…" : "Create shop"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
