// app/dashboard/super-admin/map/entrances/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  listMapEntrances,
  upsertMapEntrance,
  deleteMapEntrance,
} from "@/lib/api/super-admin.api";
import type { MapEntrance, UpsertMapEntrancePayload } from "@/types/super-admin";

export default function MapEntrancesPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId") || "";
  const [entrances, setEntrances] = useState<MapEntrance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UpsertMapEntrancePayload>({
    featureId: "",
    geometry: { type: "Point", coordinates: [0, 0] },
    properties: { name: "" },
  });

  useEffect(() => {
    if (schoolId) listMapEntrances(schoolId).then(setEntrances);
  }, [schoolId]);

  const handleSave = async () => {
    await upsertMapEntrance(schoolId, form);
    setShowForm(false);
    listMapEntrances(schoolId).then(setEntrances);
  };

  const handleDelete = async (id: string) => {
    await deleteMapEntrance(schoolId, id);
    listMapEntrances(schoolId).then(setEntrances);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Map Entrances (Super Admin)</h1>
      <button
        onClick={() => setShowForm(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Add Entrance
      </button>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">New Entrance</h2>
            <input
              type="text"
              placeholder="Feature ID"
              value={form.featureId}
              onChange={(e) => setForm({ ...form, featureId: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <input
              type="text"
              placeholder="Name"
              value={form.properties.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  properties: { ...form.properties, name: e.target.value },
                })
              }
              className="border p-2 w-full mb-2"
            />
            <input
              type="text"
              placeholder="Longitude"
              onChange={(e) =>
                setForm({
                  ...form,
                  geometry: {
                    ...form.geometry,
                    coordinates: [parseFloat(e.target.value), form.geometry.coordinates[1]],
                  },
                })
              }
              className="border p-2 w-full mb-2"
            />
            <input
              type="text"
              placeholder="Latitude"
              onChange={(e) =>
                setForm({
                  ...form,
                  geometry: {
                    ...form.geometry,
                    coordinates: [form.geometry.coordinates[0], parseFloat(e.target.value)],
                  },
                })
              }
              className="border p-2 w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded">
                Cancel
              </button>
              <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <ul>
        {entrances.map((e) => (
          <li key={e.id} className="flex justify-between items-center bg-white shadow rounded p-3 mb-2">
            <span>{e.properties.name} (Feature: {e.featureId})</span>
            <button onClick={() => handleDelete(e.id)} className="text-red-600">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}