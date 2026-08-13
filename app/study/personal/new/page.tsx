// app/study/personal/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function NewSessionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"text" | "file">("text");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return setError("Title is required");
    if (mode === "text" && !textContent) return setError("Please provide some text content.");
    if (mode === "file" && !file) return setError("Please select a file.");

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    if (mode === "text") {
      formData.append("content", textContent);
    } else {
      formData.append("file", file!);
    }
    try {
      const session = await apiPost("/personal-study/sessions", formData, true);
      router.push(`/study/personal/${session.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">New Study Session</h1>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4">
        {error && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="title">Session Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Calculus Midterm Review"
            required
          />
        </div>

        <div>
          <Label>Input Method</Label>
          <RadioGroup
            value={mode}
            onValueChange={(val) => setMode(val as "text" | "file")}
            className="flex gap-4 mt-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label htmlFor="text">Paste Text</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="file" id="file" />
              <Label htmlFor="file">Upload File</Label>
            </div>
          </RadioGroup>
        </div>

        {mode === "text" ? (
          <div>
            <Label htmlFor="content">Study Material (text)</Label>
            <Textarea
              id="content"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={8}
              placeholder="Paste your study notes, articles, or any text here..."
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="fileUpload">Upload File</Label>
            <Input
              id="fileUpload"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
            {file && <p className="text-sm text-muted-foreground mt-1">{file.name}</p>}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Creating..." : "Create Session"}
        </Button>
      </form>
    </div>
  );
}