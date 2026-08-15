"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { importMapGeoJson } from "@/lib/api/super-admin.api";

function ImportGeoJsonContent() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId") || "";
  const [json, setJson] = useState("");
  const [dryRun, setDryRun] = useState(false);
  

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(json);
      const features = parsed.features || parsed;
      const result = await importMapGeoJson(schoolId, { features });
      alert(`Imported ${result.imported} features`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Import Map GeoJSON</h1>
      <textarea value={json} onChange={e => setJson(e.target.value)} className="border p-2 w-full h-64" placeholder='{"type":"FeatureCollection","features":[...]}' />
      <label className="flex items-center gap-2 mt-2">
        <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
        Dry run (validate only)
      </label>
      <button onClick={handleImport} className="mt-4 bg-success text-primary-foreground px-4 py-2 rounded">Import</button>
    </div>
  );
}

export default function ImportGeoJsonPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ImportGeoJsonContent />
    </Suspense>
  );
}
