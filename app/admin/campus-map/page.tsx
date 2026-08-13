// app/dashboard/admin/campus-map/page.tsx (enhanced)
"use client";
import { useEffect, useState } from "react";
import {
  listMapLocations,
  deleteMapLocation,
  createMapLocation,
  updateMapLocation,
  bulkUpdateMapLocations,
} from "@/lib/api/campus-map.api";
import type { MapLocation, CreateMapLocationPayload } from "@/types/campus-map";

export default function AdminCampusMapPage() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateMapLocationPayload>({ name: "", type: "", description: "", lat: 0, lng: 0 });
  const [bulkJson, setBulkJson] = useState("");

  useEffect(() => {
    listMapLocations().then(setLocations);
  }, []);

  const handleSave = async () => {
    if (editingId) {
      await updateMapLocation(editingId, form);
    } else {
      await createMapLocation(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", type: "", description: "", lat: 0, lng: 0 });
    listMapLocations().then(setLocations);
  };

  const handleEdit = (loc: MapLocation) => {
    setForm({ name: loc.name, type: loc.type, description: loc.description || "", lat: loc.lat, lng: loc.lng });
    setEditingId(loc.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMapLocation(id);
    listMapLocations().then(setLocations);
  };

  const handleBulkUpdate = async () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!parsed.locations || !Array.isArray(parsed.locations)) throw new Error();
      await bulkUpdateMapLocations(parsed);
      setBulkJson("");
      listMapLocations().then(setLocations);
      alert("Bulk update successful");
    } catch {
      alert("Invalid JSON format. Must be { \"locations\": [...] }");
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Map Locations</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm({ name: "", type: "", description: "", lat: 0, lng: 0 });
          }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          Add Location
        </button>
      </div>

      {/* Bulk update section */}
      <div className="bg-card shadow rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Bulk Update</h2>
        <textarea
          placeholder='{ "locations": [ { "id": "loc123", "name": "New Name" } ] }'
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
          className="border p-2 w-full h-24 font-mono text-sm"
        />
        <button onClick={handleBulkUpdate} className="bg-orange-600 text-primary-foreground px-4 py-2 rounded mt-2">
          Execute Bulk Update
        </button>
      </div>

      {/* Modal form for add/edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-card rounded p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit" : "New"} Location</h2>
            <input
              type="text" placeholder="Name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <input
              type="text" placeholder="Type" value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <input
              type="text" placeholder="Description" value={form.description || ""}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <div className="flex gap-2 mb-2">
              <input
                type="number" step="any" placeholder="Lat" value={form.lat || ""}
                onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) })}
                className="border p-2 w-1/2"
              />
              <input
                type="number" step="any" placeholder="Lng" value={form.lng || ""}
                onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) })}
                className="border p-2 w-1/2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="bg-secondary/50 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleSave} className="bg-success text-primary-foreground px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Locations table */}
      <table className="w-full bg-card shadow rounded">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Coordinates</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.id} className="border-t">
              <td className="p-2">{loc.name}</td>
              <td className="p-2">{loc.type}</td>
              <td className="p-2">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</td>
              <td className="p-2 text-right">
                <button onClick={() => handleEdit(loc)} className="text-primary mr-2">Edit</button>
                <button onClick={() => handleDelete(loc.id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}