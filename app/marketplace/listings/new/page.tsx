"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createListing, uploadListingImage } from "@/lib/api/marketplace.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card } from "@/components/ui/card";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AlertCircle, Image as ImageIcon, Upload, X } from "lucide-react";

export default function NewListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadListingImage(file);
      setImages((prev) => [...prev, url]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createListing({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        images,
      });
      router.push("/marketplace/listings");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Failed to create listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you selling?"
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item in detail..."
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              rows={4}
              required
            />
          </div>
          <Input
            label="Price (₦)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Images</label>
          <div className="flex flex-wrap gap-3">
            {images.map((url, index) => (
              <div key={index} className="relative h-24 w-24 rounded-lg border border-border overflow-hidden">
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 rounded-full bg-card p-1 shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors">
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              {uploading ? (
                <span className="text-xs text-muted-foreground">Uploading...</span>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add Image</span>
                </>
              )}
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? "Creating..." : "Create Listing"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}