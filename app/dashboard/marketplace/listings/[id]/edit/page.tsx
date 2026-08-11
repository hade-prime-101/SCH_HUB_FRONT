"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getListing, updateListing, uploadListingImage } from "@/lib/api/marketplace.api";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListing(id).then((listing) => {
      setTitle(listing.title);
      setDescription(listing.description);
      setPrice(String(listing.price));
      setImages(listing.images);
      setLoading(false);
    });
  }, [id]);

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
    await updateListing(id, { title, description, price: Number(price), images });
    router.push(`/dashboard/marketplace/listings/${id}`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 w-full" required />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 w-full" required />
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="border p-2 w-full" required />
        <div>
          <label className="block mb-1">Add Image</label>
          <input type="file" onChange={handleImageUpload} disabled={uploading} />
          <div className="flex gap-2 mt-2">
            {images.map((url, i) => (
              <img key={i} src={url} className="w-20 h-20 object-cover" />
            ))}
          </div>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Changes
        </button>
      </form>
    </div>
  );
}