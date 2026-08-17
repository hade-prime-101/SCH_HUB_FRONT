"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { MaterialVisibility } from "@/types/study";

const MATERIAL_TYPES = [
  { value: 'PAST_QUESTION', label: 'Past Question' },
  { value: 'NOTE', label: 'Note' },
  { value: 'HANDOUT', label: 'Handout' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'SUMMARY', label: 'Summary' },
  { value: 'SLIDES', label: 'Slides' },
  { value: 'OTHER', label: 'Other' },
];

export default function UploadMaterialPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Single upload
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("NOTE");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<MaterialVisibility>("PUBLIC");

  // Bulk upload
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkJson, setBulkJson] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Please select a file");
    if (!title) return setError("Title is required");
    if (!type) return setError("Type is required");
    if (!courseCode) return setError("Course code is required");
    if (!courseTitle) return setError("Course title is required");

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("type", type);
    formData.append("courseCode", courseCode);
    formData.append("courseTitle", courseTitle);
    formData.append("visibility", visibility);
    if (description) formData.append("description", description);
    try {
      await apiPost("/study/materials", formData, true);
      router.push("/study/materials");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMsg = err.message || "Failed to upload material";
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleBulk = async () => {
    if (bulkFiles.length === 0) return setError("Select at least one file");
    let materials;
    try {
      materials = JSON.parse(bulkJson || "[]");
    } catch {
      return setError("Invalid JSON");
    }
    if (!Array.isArray(materials) || materials.length !== bulkFiles.length) {
      return setError("Number of files must match number of material objects");
    }
    setUploading(true);
    const formData = new FormData();
    bulkFiles.forEach((f) => formData.append("files", f));
    formData.append("materials", JSON.stringify(materials));
    try {
      await apiPost("/study/materials/bulk", formData, true);
      router.push("/study/materials");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles(files => files.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Material</h1>
        <p className="text-muted-foreground">Share your study resources with the community</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-3 bg-muted/50 rounded-xl p-1">
        <button
          onClick={() => setMode("single")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            mode === "single" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Single Upload
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            mode === "bulk" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Bulk Upload
        </button>
      </div>

      {error && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-destructive text-sm space-y-2">
          <p>{error}</p>
        </div>
      )}

      {mode === "single" ? (
        <form onSubmit={handleSingle} className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div>
            <Label htmlFor="file">File <span className="text-destructive">*</span></Label>
            <div className="mt-1 flex items-center gap-3">
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {file && (
                <span className="text-sm text-muted-foreground truncate max-w-xs">{file.name}</span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
              required 
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="type">Type <span className="text-destructive">*</span></Label>
            <Select value={type} onValueChange={setType} disabled={uploading}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="courseCode">Course Code <span className="text-destructive">*</span></Label>
            <Input 
              id="courseCode" 
              value={courseCode} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCourseCode(e.target.value)} 
              required
              disabled={uploading}
              placeholder="e.g., CSC101"
            />
          </div>

          <div>
            <Label htmlFor="courseTitle">Course Title <span className="text-destructive">*</span></Label>
            <Input 
              id="courseTitle" 
              value={courseTitle} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCourseTitle(e.target.value)} 
              required
              disabled={uploading}
              placeholder="e.g., Introduction to Computer Science"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.currentTarget.value)} 
              rows={3}
              disabled={uploading}
              placeholder="Add details about this material..."
            />
          </div>

          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(val) => setVisibility(val as MaterialVisibility)} disabled={uploading}>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="DEPARTMENT">Department</SelectItem>
                <SelectItem value="LEVEL">Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div>
            <Label>Select Files <span className="text-destructive">*</span></Label>
            <Input
              type="file"
              multiple
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const files = Array.from(e.target.files ?? []);
                setBulkFiles(prev => [...prev, ...files]);
              }}
              className="mt-1"
              disabled={uploading}
            />
            {bulkFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {bulkFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm">
                    <span className="truncate">{f.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removeBulkFile(i)} 
                      className="text-destructive hover:text-destructive/80"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="bulkJson">Materials JSON (array of objects)</Label>
            <Textarea
              id="bulkJson"
              placeholder='[{"title":"Math Notes","type":"NOTE","courseCode":"MTH101","courseTitle":"Calculus I","departmentId":"...","visibility":"PUBLIC"}]'
              value={bulkJson}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkJson(e.target.value)}
              rows={5}
              className="mt-1 font-mono text-sm"
              disabled={uploading}
            />
          </div>
          <Button onClick={handleBulk} disabled={uploading || bulkFiles.length === 0}>
            {uploading ? "Uploading..." : "Upload All"}
          </Button>
        </div>
      )}
    </div>
  );
}
