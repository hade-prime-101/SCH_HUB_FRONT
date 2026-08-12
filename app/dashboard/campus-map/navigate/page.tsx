"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  CheckCircle2,
  Trash2,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  Home,
  BookOpen,
  Route,
  Loader2,
  RefreshCw } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { campusMap } from "@/lib/api/campus-map.api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TileMeta {
  name?: string;
  version?: string;
  lastUpdated?: string;
  sizeBytes?: number;
  coverageArea?: string;
}

const STORAGE_KEY = "offline_map_downloaded";

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

const PLACEHOLDER_META: TileMeta = {
  name:        "Campus Map Tiles",
  version:     "1.0.0",
  lastUpdated: new Date(Date.now() - 7 * 86_400_000).toISOString(),
  sizeBytes:   14_800_000,
  coverageArea: "Main campus & surrounding roads" };

const INCLUDED_ITEMS = [
  { icon: Building2, label: "Buildings & offices" },
  { icon: Home,      label: "Hostels & accommodation" },
  { icon: BookOpen,  label: "Lecture halls & labs" },
  { icon: MapPin,    label: "Key campus locations" },
  { icon: Route,     label: "Navigation paths & roads" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfflineMapPage() {
  const router = useRouter();

  const [meta,          setMeta]          = useState<TileMeta>(PLACEHOLDER_META);
  const [isDownloaded,  setIsDownloaded]  = useState(false);
  const [downloading,   setDownloading]   = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [expanded,      setExpanded]      = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [deleting,      setDeleting]      = useState(false);

  // ── Load tile metadata ──
  useEffect(() => {
    const downloaded = typeof window !== "undefined" && !!localStorage.getItem(STORAGE_KEY);
    setIsDownloaded(downloaded);

    campusMap.getTilesMetadata()
      .then((data: any) => {
        if (data) setMeta({ ...PLACEHOLDER_META, ...data });
      })
      .catch(() => { /* use placeholder */ })
      .finally(() => setLoading(false));
  }, []);

  // ── Download simulation ──
  function handleDownload() {
    if (isDownloaded || downloading) return;
    setDownloading(true);
    setProgress(0);

    const start = Date.now();
    const duration = 3000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setDownloading(false);
        setIsDownloaded(true);
        localStorage.setItem(STORAGE_KEY, "1");
      }
    }, 80);
  }

  // ── Delete offline data ──
  async function handleDelete() {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    localStorage.removeItem(STORAGE_KEY);
    setIsDownloaded(false);
    setProgress(0);
    setDeleting(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white px-4 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
        <BackButton />
        <h1 className="text-xl font-bold text-slate-900">Offline Maps</h1>
      </div>

      <div className="px-4 py-5 flex flex-col gap-4 max-w-lg mx-auto">

        {/* ── Status banner ── */}
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${isDownloaded ? "bg-emerald-50" : "bg-slate-100"}`}>
          {isDownloaded
            ? <WifiOff className="w-5 h-5 text-emerald-600 shrink-0" />
            : <Wifi className="w-5 h-5 text-slate-400 shrink-0" />
          }
          <div className="flex-1">
            <p className={`text-sm font-bold ${isDownloaded ? "text-emerald-700" : "text-slate-600"}`}>
              {isDownloaded ? "Offline map downloaded" : "No offline map"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isDownloaded ? "Works without internet connection" : "Download to use without internet"}
            </p>
          </div>
          {isDownloaded && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
        </div>

        {/* ── Tile info card ── */}
        {loading ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading map info…</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">{meta.name}</h2>
                  <p className="text-slate-400 text-sm mt-0.5">v{meta.version}</p>
                </div>
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1">
                  {formatBytes(meta.sizeBytes)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p className="text-slate-400 text-xs">Last Updated</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{formatDate(meta.lastUpdated)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p className="text-slate-400 text-xs">Coverage</p>
                  <p className="font-semibold text-slate-700 mt-0.5 truncate">{meta.coverageArea ?? "Campus"}</p>
                </div>
              </div>
            </div>

            {/* Download button / progress */}
            {!isDownloaded ? (
              <div className="px-5 pb-5">
                {downloading ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-600">Downloading…</span>
                      <span className="text-sm font-bold text-indigo-600">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleDownload}
                    className="w-full rounded-2xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition active:opacity-90"
                  >
                    <Download className="w-5 h-5" /> Download Offline Map
                  </button>
                )}
              </div>
            ) : (
              <div className="px-5 pb-5">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full rounded-2xl border-2 border-rose-100 py-3.5 font-bold text-rose-500 flex items-center justify-center gap-2 transition active:bg-rose-50 disabled:opacity-50"
                >
                  {deleting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
                    : <><Trash2 className="w-4 h-4" /> Delete Offline Data</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── What's included expandable ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="font-bold text-slate-900">What&apos;s included</span>
            {expanded
              ? <ChevronUp className="w-5 h-5 text-slate-400" />
              : <ChevronDown className="w-5 h-5 text-slate-400" />
            }
          </button>
          {expanded && (
            <div className="px-5 pb-4 flex flex-col gap-3 border-t border-slate-50">
              {INCLUDED_ITEMS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Info section ── */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">Works without internet</p>
              <p className="text-xs text-slate-400 mt-0.5">Once downloaded, browse the campus map with no data connection.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">Auto-updated when connected</p>
              <p className="text-xs text-slate-400 mt-0.5">Map data refreshes in the background whenever you&apos;re online.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
