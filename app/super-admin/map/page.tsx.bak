// map/page.tsx
"use client";
import { useEffect, useState } from "react";
import { listMapFeatures, deleteMapFeature, upsertMapFeature, uploadMapFeatureImage, deleteMapFeatureImage } from "@/lib/api/super-admin.api";
import type { MapFeature, UpsertMapFeaturePayload } from "@/types/super-admin";
import { useSearchParams } from "next/navigation";

export default function MapAdminPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId") || "";
  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UpsertMapFeaturePayload>({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { name: "", category: "", description: "" }
  });

  useEffect(() => {
    if (schoolId) listMapFeatures(schoolId).then(setFeatures);
  }, [schoolId]);

  const handleSave = async () => {
    await upsertMapFeature(schoolId, form);
    setShowForm(false);
    listMapFeatures(schoolId).then(setFeatures);
  };

  const handleDelete = async (featureId: string) => {
    await deleteMapFeature(schoolId, featureId);
    listMapFeatures(schoolId).then(setFeatures);
  };
  // Inside the component (add these state and functions)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [uploadingId, setUploadingId] = useState<string | null>(null);

const handleImageUpload = async (featureId: string, file: File) => {
  setUploadingId(featureId);
  await uploadMapFeatureImage(schoolId, featureId, file);
  setUploadingId(null);
  listMapFeatures(schoolId).then(setFeatures);
};

const handleImageDelete = async (featureId: string, imageUrl: string) => {
  await deleteMapFeatureImage(schoolId, featureId, imageUrl);
  listMapFeatures(schoolId).then(setFeatures);
};

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Map Features (Super Admin)</h1>
      <button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded mb-4">Add Feature</button>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-card rounded p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">New Feature</h2>
            <input type="text" placeholder="Name" value={form.properties.name} onChange={e => setForm({...form, properties: {...form.properties, name: e.target.value}})} className="border p-2 w-full mb-2" />
            <input type="text" placeholder="Category" value={form.properties.category} onChange={e => setForm({...form, properties: {...form.properties, category: e.target.value}})} className="border p-2 w-full mb-2" />
            <input type="text" placeholder="Description" value={form.properties.description || ""} onChange={e => setForm({...form, properties: {...form.properties, description: e.target.value}})} className="border p-2 w-full mb-2" />
            <input type="text" placeholder="Longitude" onChange={e => setForm({...form, geometry: {...form.geometry, coordinates: [parseFloat(e.target.value), form.geometry.coordinates[1]]}})} className="border p-2 w-full mb-2" />
            <input type="text" placeholder="Latitude" onChange={e => setForm({...form, geometry: {...form.geometry, coordinates: [form.geometry.coordinates[0], parseFloat(e.target.value)]}})} className="border p-2 w-full mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="bg-secondary/50 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleSave} className="bg-success text-primary-foreground px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
      <ul>
        {features.map(f => (
          <li key={f.id} className="flex justify-between items-center bg-card shadow rounded p-3 mb-2">
            <span>{f.properties.name} ({f.properties.category})</span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-primary cursor-pointer">
                Upload Image
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(f.id, file);
                  }}
                />
              </label>
              {f.properties.imageUrl && (
                <button
                  onClick={() => handleImageDelete(f.id, f.properties.imageUrl!)}
                  className="text-red-600 text-sm"
                >
                  Delete Image
                </button>
              )}
              <button onClick={() => handleDelete(f.id)} className="text-red-600">
                Delete Feature
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}