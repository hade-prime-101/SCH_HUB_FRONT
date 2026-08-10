"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Loader2, AlertTriangle, Store } from "lucide-react";
import { marketplaceApi } from "@/lib/api/marketplace";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListingCategory  = "BOOKS" | "ELECTRONICS" | "CLOTHING" | "FURNITURE" | "FOOD" | "HANDOUTS" | "SERVICES" | "OTHER";
type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

interface Shop { id: string; name: string; }

export interface ListingFormData {
  title:           string;
  description:     string;
  price:           string;
  category:        ListingCategory | "";
  condition:       ListingCondition | "";
  pickupLocation:  string;
  whatsappContact: string;
  shopId:          string;
  isAvailable:     boolean;
  // Local preview URL (blob://) shown in the UI — NOT sent to the backend
  photoPreview:    string | null;
  // Real uploaded URL returned by the server — sent as images[0]
  photoUrl:        string | null;
}

export const EMPTY_FORM: ListingFormData = {
  title:           "",
  description:     "",
  price:           "",
  category:        "",
  condition:       "",
  pickupLocation:  "",
  whatsappContact: "",
  shopId:          "",
  isAvailable:     true,
  photoPreview:    null,
  photoUrl:        null,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: "BOOKS",       label: "Books" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "CLOTHING",    label: "Clothing" },
  { value: "FURNITURE",   label: "Furniture" },
  { value: "FOOD",        label: "Food" },
  { value: "HANDOUTS",    label: "Handouts" },
  { value: "SERVICES",    label: "Services" },
  { value: "OTHER",       label: "Other" },
];

const CONDITIONS: { value: ListingCondition; label: string; hint: string }[] = [
  { value: "NEW",      label: "New",      hint: "Never used, sealed or unused" },
  { value: "LIKE_NEW", label: "Like New", hint: "Barely used, excellent condition" },
  { value: "GOOD",     label: "Good",     hint: "Some signs of use, works perfectly" },
  { value: "FAIR",     label: "Fair",     hint: "Noticeable wear but fully functional" },
  { value: "POOR",     label: "Poor",     hint: "Heavy wear, may have minor issues" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked:   boolean;
  onChange:  () => void;
  disabled?: boolean;
  label:     string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors shrink-0 ${
        checked ? "bg-foreground justify-end" : "bg-border justify-start"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <span className="w-5 h-5 rounded-full bg-card shadow-sm" />
    </button>
  );
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label:     string;
  required?: boolean;
  children:  React.ReactNode;
  hint?:     string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

const SELECT_CLS =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none";

// ─── Shared Form ──────────────────────────────────────────────────────────────

export function ListingForm({
  initialData = EMPTY_FORM,
  editMode    = false,
  listingId,
  onSuccess,
}: {
  initialData?: ListingFormData;
  editMode?:    boolean;
  listingId?:   string;
  onSuccess?:   (id: string) => void;
}) {
  const router = useRouter();

  const [form, setForm]               = useState<ListingFormData>(initialData);
  const [uploadProgress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [touched, setTouched]         = useState<Partial<Record<keyof ListingFormData, boolean>>>({});

  // ── shops ────────────────────────────────────────────────────────────────────
  const [shops, setShops]           = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setShopsLoading(true);
    // Load own shop via profile endpoint if available; graceful fallback to empty
    marketplaceApi.getShop("me")
      .then((data: any) => {
        if (!cancelled && data?.id) setShops([data]);
      })
      .catch(() => {/* shops are optional — silent fail */})
      .finally(() => { if (!cancelled) setShopsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── field helpers ────────────────────────────────────────────────────────────

  function set<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }
  function touch(key: keyof ListingFormData) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  // ── photo upload ─────────────────────────────────────────────────────────────

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024)   { setError("Photo must be under 10 MB."); return; }

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    set("photoPreview", previewUrl);
    set("photoUrl", null); // clear any previous uploaded URL
    setProgress(0);

    try {
      // Simulate incremental progress while upload is in flight
      let fakeProgress = 0;
      const tick = setInterval(() => {
        fakeProgress = Math.min(fakeProgress + Math.floor(Math.random() * 15) + 5, 90);
        setProgress(fakeProgress);
      }, 150);

      const result = await marketplaceApi.uploadListingImage(file);

      clearInterval(tick);
      setProgress(100);
      setTimeout(() => setProgress(null), 400);

      set("photoUrl", result.url);
    } catch (err: unknown) {
      setProgress(null);
      set("photoPreview", null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError(err instanceof Error ? err.message : "Image upload failed. Please try again.");
    }
  }, []);

  // ── validation ───────────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!form.title.trim())                                    return "Title is required.";
    if (!form.price.trim())                                    return "Price is required.";
    if (isNaN(Number(form.price)) || Number(form.price) < 0)  return "Enter a valid price.";
    if (!form.category)                                        return "Please select a category.";
    if (!form.condition)                                       return "Please select a condition.";
    return null;
  }

  // Inline field errors shown after blur
  const titleError     = touched.title     && !form.title.trim()    ? "Required" : undefined;
  const priceError     = touched.price     && (!form.price.trim() || isNaN(Number(form.price)) || Number(form.price) < 0)
    ? "Enter a valid price"
    : undefined;
  const categoryError  = touched.category  && !form.category  ? "Required" : undefined;
  const conditionError = touched.condition && !form.condition ? "Required" : undefined;

  // ── submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    // Touch all required fields to surface errors
    setTouched({ title: true, price: true, category: true, condition: true });
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title:           form.title.trim(),
      description:     form.description.trim(),
      price:           Number(form.price),
      category:        form.category,
      condition:       form.condition,
      pickupLocation:  form.pickupLocation.trim(),
      whatsappContact: form.whatsappContact.trim(),
      ...(form.shopId  ? { shopId: form.shopId } : {}),
      // Send as images array — matches the schema's Json[] field
      images:          form.photoUrl ? [form.photoUrl] : [],
      ...(editMode     ? { isAvailable: form.isAvailable } : {}),
    };

    try {
      let result: any;
      if (editMode && listingId) {
        result = await marketplaceApi.updateListing(listingId, payload);
      } else {
        result = await marketplaceApi.createListing(payload);
      }
      if (onSuccess) {
        onSuccess(result?.id ?? listingId ?? "");
      } else {
        // In edit mode, result?.id may be undefined (updateListing may not return an id).
        // Fall back to the listingId prop which is always available in edit mode.
        const id = editMode ? (listingId ?? result?.id) : (result?.id ?? listingId);
        router.push(id ? `/dashboard/marketplace/${id}` : "/dashboard/marketplace/listings");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const uploading = uploadProgress !== null;
  // Block submit while image is still uploading or form is submitting
  const canSubmit = !uploading && !submitting;

  return (
    <div className="min-h-screen w-full bg-muted px-6 py-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-center relative mb-8">
        <button onClick={() => router.back()} aria-label="Go back" className="absolute left-0">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          {editMode ? "Edit Listing" : "New Listing"}
        </h1>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 rounded-2xl px-4 py-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => setError(null)} aria-label="Dismiss" className="ml-auto">
            <X className="w-4 h-4 text-destructive" />
          </button>
        </div>
      )}

      {/* ── Photo strip ── */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 w-24 h-24 rounded-2xl border-2 border-dashed border-border text-muted-foreground shrink-0 hover:border-primary transition-colors"
          aria-label="Add photo"
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs font-medium">Add photo</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />

        {(uploading || form.photoPreview) && (
          <div className="relative w-24 h-24 rounded-2xl bg-muted overflow-hidden shrink-0 border border-border">
            {!uploading && (
              <button
                type="button"
                onClick={() => {
                  set("photoPreview", null);
                  set("photoUrl", null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Remove photo"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-card flex items-center justify-center shadow-sm z-10"
              >
                <X className="w-3.5 h-3.5 text-foreground" />
              </button>
            )}
            {form.photoPreview && (
              <img
                src={form.photoPreview}
                alt="Listing preview"
                className="w-full h-full object-cover"
              />
            )}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/20 gap-1">
                <Loader2 className="w-6 h-6 text-card animate-spin" />
                <span className="text-[10px] font-bold text-card">{uploadProgress}%</span>
              </div>
            )}
          </div>
        )}

        {!uploading && !form.photoPreview && (
          <p className="text-sm text-muted-foreground">
            Add a clear photo to attract more buyers
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Title ── */}
        <Field label="Title" required>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            onBlur={() => touch("title")}
            placeholder="What are you selling?"
            maxLength={100}
            className={`${INPUT_CLS} ${titleError ? "border-destructive focus:ring-destructive/30" : ""}`}
          />
          {titleError && <p className="text-xs text-destructive">{titleError}</p>}
        </Field>

        {/* ── Description ── */}
        <Field
          label="Description"
          hint={`${form.description.length}/500 characters`}
        >
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe condition details, included accessories, reason for selling…"
            rows={5}
            maxLength={500}
            className={`${INPUT_CLS} resize-none`}
          />
        </Field>

        {/* ── Price ── */}
        <Field label="Price (₦)" required>
          <div className={`flex items-center rounded-xl border bg-card px-4 focus-within:ring-2 focus-within:ring-ring ${priceError ? "border-destructive" : "border-border"}`}>
            <span className="text-muted-foreground mr-2 shrink-0 font-bold">₦</span>
            <input
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              onBlur={() => touch("price")}
              placeholder="0"
              inputMode="numeric"
              className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          {priceError && <p className="text-xs text-destructive">{priceError}</p>}
        </Field>

        {/* ── Category ── */}
        <Field label="Category" required>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value as ListingCategory | "")}
            onBlur={() => touch("category")}
            className={`${SELECT_CLS} ${categoryError ? "border-destructive" : ""}`}
          >
            <option value="">Select category</option>
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {categoryError && <p className="text-xs text-destructive">{categoryError}</p>}
        </Field>

        {/* ── Condition chips ── */}
        <Field label="Condition" required>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CONDITIONS.map(({ value, label, hint }) => (
              <button
                key={value}
                type="button"
                onClick={() => { set("condition", value); touch("condition"); }}
                className={`text-left rounded-xl border px-3 py-3 transition-colors ${
                  form.condition === value
                    ? "border-primary bg-accent"
                    : "border-border bg-card"
                }`}
              >
                <p className={`text-sm font-bold ${form.condition === value ? "text-primary" : "text-foreground"}`}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{hint}</p>
              </button>
            ))}
          </div>
          {conditionError && <p className="text-xs text-destructive">{conditionError}</p>}
        </Field>

        {/* ── Pickup location ── */}
        <Field label="Pickup location" hint="Where should the buyer meet you?">
          <input
            value={form.pickupLocation}
            onChange={(e) => set("pickupLocation", e.target.value)}
            placeholder="e.g. Main Library, North Campus"
            className={INPUT_CLS}
          />
        </Field>

        {/* ── WhatsApp ── */}
        <Field
          label="WhatsApp contact"
          hint="Buyers will message you on this number"
        >
          <input
            value={form.whatsappContact}
            onChange={(e) => set("whatsappContact", e.target.value)}
            placeholder="+234 800 000 0000"
            inputMode="tel"
            className={INPUT_CLS}
          />
        </Field>

        {/* ── Shop (optional) ── */}
        <Field label="List under a shop" hint="Optional — link this listing to one of your shops">
          <div className="relative">
            {shopsLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <select
              value={form.shopId}
              onChange={(e) => set("shopId", e.target.value)}
              disabled={shopsLoading}
              className={`${SELECT_CLS} ${shopsLoading ? "opacity-60" : ""}`}
            >
              <option value="">None — list independently</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {!shopsLoading && shops.length === 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Store className="w-3.5 h-3.5" />
              You have no shops yet —{" "}
              <a
                href="/dashboard/marketplace/shops/create"
                className="text-primary font-semibold underline underline-offset-2"
              >
                create one
              </a>
            </p>
          )}
        </Field>

        {/* ── Availability (edit mode only) ── */}
        <div className={`flex items-center justify-between rounded-2xl border p-4 ${editMode ? "border-border bg-card" : "border-border bg-muted opacity-50"}`}>
          <div>
            <p className="font-bold text-foreground">Still available</p>
            <p className="text-muted-foreground text-sm">
              {editMode ? "Toggle off to mark as sold" : "Only editable after publishing"}
            </p>
          </div>
          <Toggle
            checked={form.isAvailable}
            onChange={() => set("isAvailable", !form.isAvailable)}
            disabled={!editMode}
            label="Toggle availability"
          />
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-2xl border border-border py-3.5 font-bold text-foreground bg-card"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting
              ? (editMode ? "Saving…"     : "Publishing…")
              : (editMode ? "Save changes" : "Publish listing")}
          </button>
        </div>

      </div>
    </div>
  );
}
