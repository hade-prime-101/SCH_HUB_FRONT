"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Upload, CheckCircle2, AlertTriangle, Loader2, X, FileJson,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";

interface ValidationResult {
  valid:    boolean;
  count?:   number;
  types?:   string[];
  error?:   string;
  features?: unknown[];
}

interface ImportResult {
  imported?: number;
  failed?:   number;
  errors?:   string[];
}

export default function MapImportPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const schoolId     = searchParams.get("schoolId") ?? "";
  const schoolName   = searchParams.get("schoolName") ?? "School";

  const fileRef = useRef<HTMLInputElement>(null);

  const [json,       setJson]       = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing,  setImporting]  = useState(false);
  const [result,     setResult]     = useState<ImportResult | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  function handleFileRead(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJson(ev.target?.result as string ?? "");
      setValidation(null);
      setResult(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleValidate() {
    setValidation(null); setError(null);
    if (!json.trim()) { setError("Please paste or upload a GeoJSON file first."); return; }
    try {
      const parsed = JSON.parse(json);
      if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
        setValidation({ valid: false, error: "Must be a GeoJSON FeatureCollection with a `features` array." });
        return;
      }
      const types = [...new Set<string>(parsed.features.map((f: any) => f.properties?.category ?? f.properties?.type ?? "UNKNOWN"))];
      setValidation({ valid: true, count: parsed.features.length, types, features: parsed.features });
    } catch (e: any) {
      setValidation({ valid: false, error: `JSON parse error: ${e.message}` });
    }
  }

  async function handleImport() {
    if (!validation?.valid || !validation.features || !schoolId) return;
    setImporting(true); setError(null);
    try {
      const res = await adminApi.importMapData(schoolId, validation.features) as any;
      setResult({ imported: res?.imported ?? validation.features.length, failed: res?.failed ?? 0, errors: res?.errors });
    } catch (e: any) {
      setError(e.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0" aria-label="Go back">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Import Map Data</h1>
          {schoolName && <p className="text-xs text-slate-400 mt-0.5">{schoolName}</p>}
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">

        {!schoolId && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 rounded-2xl px-4 py-3 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" /> No school ID provided. Go back and select a school.
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 text-sm font-medium">
            <span>{error}</span><button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* File picker */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 text-sm">GeoJSON Input</h2>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-sm font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-xl transition active:bg-indigo-100"
            >
              <Upload className="w-4 h-4" /> Upload file
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".json,.geojson" className="hidden" onChange={handleFileRead} />
          <textarea
            value={json}
            onChange={(e) => { setJson(e.target.value); setValidation(null); setResult(null); }}
            placeholder={'Paste your GeoJSON FeatureCollection here…\n{\n  "type": "FeatureCollection",\n  "features": [...]\n}'}
            rows={10}
            className="w-full px-3 py-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none bg-slate-50"
          />
        </div>

        {/* Validate button */}
        <button onClick={handleValidate} disabled={!json.trim()}
          className="w-full rounded-2xl border-2 border-indigo-200 py-3.5 font-bold text-indigo-600 flex items-center justify-center gap-2 disabled:opacity-40 transition active:bg-indigo-50">
          <FileJson className="w-5 h-5" /> Validate JSON
        </button>

        {/* Validation result */}
        {validation && (
          <div className={`rounded-2xl px-5 py-4 flex items-start gap-3 ${validation.valid ? "bg-emerald-50" : "bg-rose-50"}`}>
            {validation.valid
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              : <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            }
            <div>
              {validation.valid ? (
                <>
                  <p className="font-bold text-emerald-700 text-sm">Valid GeoJSON — {validation.count} feature{validation.count !== 1 ? "s" : ""} found</p>
                  {validation.types && validation.types.length > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">Types: {validation.types.join(", ")}</p>
                  )}
                </>
              ) : (
                <p className="font-bold text-rose-600 text-sm">{validation.error}</p>
              )}
            </div>
          </div>
        )}

        {/* Import result */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
            <h3 className="font-bold text-slate-900 mb-2">Import Complete</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{result.imported ?? 0}</p>
                <p className="text-xs text-slate-400 font-medium">Imported</p>
              </div>
              <div className={`rounded-xl px-4 py-3 text-center ${(result.failed ?? 0) > 0 ? "bg-rose-50" : "bg-slate-50"}`}>
                <p className={`text-2xl font-bold ${(result.failed ?? 0) > 0 ? "text-rose-500" : "text-slate-400"}`}>{result.failed ?? 0}</p>
                <p className="text-xs text-slate-400 font-medium">Failed</p>
              </div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold text-slate-500 mb-1">Errors:</p>
                {result.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-rose-500 mb-0.5">{e}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import button */}
        <button
          onClick={handleImport}
          disabled={!validation?.valid || importing || !schoolId || !!result}
          className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 transition active:opacity-90"
        >
          {importing ? <><Loader2 className="w-5 h-5 animate-spin" /> Importing…</> : "Import Features"}
        </button>

      </div>
    </div>
  );
}
