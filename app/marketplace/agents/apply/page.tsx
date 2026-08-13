"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Upload,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function ApplyAgentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    businessName: "",
    businessAddress: "",
    phoneNumber: "",
  });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setF(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    setError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
    setError(null);
  }

  function removeFile() {
    setIdFile(null);
    setIdPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!form.businessName.trim()) {
      setError("Business name is required.");
      return;
    }
    if (!form.businessAddress.trim()) {
      setError("Business address is required.");
      return;
    }
    if (!form.phoneNumber.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!idFile) {
      setError("Please upload a photo of your student ID card.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await marketplaceApi.applyAsAgent({
        businessName: form.businessName.trim(),
        businessAddress: form.businessAddress.trim(),
        phoneNumber: form.phoneNumber.trim(),
        studentIdFile: idFile,
      });
      // Success – redirect to agent profile
      router.push("/marketplace/agents");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Application failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="h-11 w-11 rounded-2xl bg-card shadow-sm flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Become a House Agent</h1>
          <p className="text-sm text-muted-foreground">List verified properties for students</p>
        </div>
      </div>

      {/* Benefits Card */}
      <Card className="p-5 bg-primary text-primary-foreground border-none">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold">Become a House Agent</p>
            <p className="text-primary-foreground/70 text-sm">List verified properties for students</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {["List unlimited accommodation", "Verified agent badge on listings", "Reach thousands of students"].map(
            (benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary-foreground/80 shrink-0" />
                <p className="text-primary-foreground/80 text-sm">{benefit}</p>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Application Form */}
      <Card className="p-5 space-y-4">
        <h2 className="font-bold text-foreground text-lg">Application Details</h2>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        <Input
          label="Business Name *"
          value={form.businessName}
          onChange={(e) => setF("businessName", e.target.value)}
          placeholder="e.g. Bright Properties"
          required
        />

        <Input
          label="Business Address *"
          value={form.businessAddress}
          onChange={(e) => setF("businessAddress", e.target.value)}
          placeholder="e.g. No. 5 Main Street, Sabo"
          required
        />

        <Input
          label="Phone Number *"
          value={form.phoneNumber}
          onChange={(e) => setF("phoneNumber", e.target.value)}
          placeholder="+234..."
          required
        />

        {/* Student ID Upload */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Student ID Card Photo *
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Upload a clear photo of your school-issued student ID card
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {idPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={idPreview} alt="Student ID preview" className="h-48 w-full object-cover" />
              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove image"
                className="absolute right-2 top-2 h-8 w-8 rounded-full bg-card shadow-md flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Upload className="h-7 w-7" />
              <span className="text-sm font-medium">Tap to upload photo</span>
              <span className="text-xs">JPG, PNG — max 5 MB</span>
            </button>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full gap-2 shadow-lg shadow-primary/20"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
          {submitting ? "Submitting…" : "Submit Application"}
        </Button>
      </Card>
    </div>
  );
}