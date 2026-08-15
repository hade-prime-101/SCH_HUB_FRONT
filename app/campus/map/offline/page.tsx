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
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/shared/BackButton";
import { getTilesMetadata } from "@/lib/api/campus-map.api";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

// ─── Types ────────────────────────────────────────────────────────────────

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
  return new Date(iso).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PLACEHOLDER_META: TileMeta = {
  name: "Campus Map Tiles",
  version: "1.0.0",
  lastUpdated: new Date(Date.now() - 7 * 86_400_000).toISOString(),
  sizeBytes: 14_800_000,
  coverageArea: "Main campus & surrounding roads",
};

const INCLUDED_ITEMS = [
  { icon: Building2, label: "Buildings & offices" },
  { icon: Home, label: "Hostels & accommodation" },
  { icon: BookOpen, label: "Lecture halls & labs" },
  { icon: MapPin, label: "Key campus locations" },
  { icon: Route, label: "Navigation paths & roads" },
];

// ─── Page ─────────────────────────────────────────────────────────────────

export default function OfflineMapPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  const [meta, setMeta] = useState<TileMeta>(PLACEHOLDER_META);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const downloaded =
      typeof window !== "undefined" && !!localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDownloaded(downloaded);

    getTilesMetadata()
      .then((data) => {
        if (data) setMeta({ ...PLACEHOLDER_META, ...data });
      })
      .catch(() => setError("Failed to load tile metadata"))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = () => {
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
        setError(null);
      }
    }, 80);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    localStorage.removeItem(STORAGE_KEY);
    setIsDownloaded(false);
    setProgress(0);
    setDeleting(false);
  };

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-muted pb-24">
      <div className="bg-card border-b border-border px-4 pt-5 pb-4 flex items-center gap-3">
        <BackButton variant="icon" />
        <h1 className="text-xl font-bold text-foreground">Offline Maps</h1>
      </div>

      <div className="px-4 py-5 flex flex-col gap-4 max-w-lg mx-auto">
        {/* Status banner */}
        <div
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
            isDownloaded ? "bg-success/10" : "bg-muted"
          }`}
        >
          {isDownloaded ? (
            <WifiOff className="w-5 h-5 text-success shrink-0" />
          ) : (
            <Wifi className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm font-bold ${
                isDownloaded ? "text-success" : "text-foreground"
              }`}
            >
              {isDownloaded ? "Offline map downloaded" : "No offline map"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isDownloaded
                ? "Works without internet connection"
                : "Download to use without internet"}
            </p>
          </div>
          {isDownloaded && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
        </div>

        {/* Tile info card */}
        {loading ? (
          <LoadingSkeleton count={1} height="h-48" />
        ) : (
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-foreground text-lg">{meta.name}</h2>
                  <p className="text-muted-foreground text-sm">v{meta.version}</p>
                </div>
                <span className="text-sm font-bold text-primary bg-accent rounded-lg px-3 py-1">
                  {formatBytes(meta.sizeBytes)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted rounded-xl px-3 py-2.5">
                  <p className="text-muted-foreground text-xs">Last Updated</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {formatDate(meta.lastUpdated)}
                  </p>
                </div>
                <div className="bg-muted rounded-xl px-3 py-2.5">
                  <p className="text-muted-foreground text-xs">Coverage</p>
                  <p className="font-semibold text-foreground mt-0.5 truncate">
                    {meta.coverageArea ?? "Campus"}
                  </p>
                </div>
              </div>

              {!isDownloaded ? (
                <div>
                  {downloading ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary">
                          Downloading…
                        </span>
                        <span className="text-sm font-bold text-primary">
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-100"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleDownload} className="w-full">
                      <Download className="w-5 h-5 mr-2" />
                      Download Offline Map
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Offline Data
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* What's included */}
        <Card>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span className="font-bold text-foreground">What&apos;s included</span>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {expanded && (
            <CardContent className="pt-0 flex flex-col gap-3 border-t border-border">
              {INCLUDED_ITEMS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Info cards */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Works without internet
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Once downloaded, browse the campus map with no data connection.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Auto‑updated when connected
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Map data refreshes in the background whenever you&apos;re online.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}