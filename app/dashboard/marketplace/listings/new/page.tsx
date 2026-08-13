"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createListing, uploadListingImage } from "@/lib/api/marketplace.api";

export default function NewListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url } = await uploadListingImage(file);
    setImages((prev) => [...prev, url]);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createListing({ title, description, price: Number(price), images });
    router.push("/dashboard/marketplace/listings");
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Listing</h1>
      <form onSubmit={handleSubmit} className="bg-card shadow rounded p-6 space-y-4">
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 w-full" required />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 w-full" required />
        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="border p-2 w-full" required />
        <div>
          <label className="block mb-1">Images</label>
          <input type="file" onChange={handleImageUpload} disabled={uploading} />
          <div className="flex gap-2 mt-2">
            {images.map((url, i) => (
              <img key={i} src={url} className="w-20 h-20 object-cover" />
            ))}
          </div>
        </div>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Create
        </button>
      </form>
    </div>
  );
}