"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Navigation2, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import NavigationMapView from "@/components/campus/NavigationMapView";
import {
  calculateSimpleRoute,
  getRouteProgress,
} from "@/lib/api/campus-map.api";
import type { RouteResponse, RouteProgressResult } from "@/types/campus-map";

export default function NavigatePage() {
  const router = useRouter();
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [progress, setProgress] = useState<RouteProgressResult | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState(false);
  const watchId = useRef<number | null>(null);

  // Hardcoded destination – in real app would come from query param or state
  const destination = { lat: 9.05, lng: 7.5 };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const from = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserPosition(from);
        try {
          const routeData = await calculateSimpleRoute({
            fromLat: from.lat,
            fromLng: from.lng,
            toLat: destination.lat,
            toLng: destination.lng,
            profile: "foot",
          });
          setRoute(routeData);
          setLoading(false);
          // Start watching position
          startWatching(routeData);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to calculate route");
          setLoading(false);
        }
      },
      (err) => {
        setError("GPS error: " + err.message);
        setLoading(false);
      }
    );

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const startWatching = (r: RouteResponse) => {
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserPosition(current);
        try {
          const prog = await getRouteProgress({
            currentPosition: current,
            routeGeometry: r.geometry,
          });
          setProgress(prog);
        } catch (e) {
          // silently fail
        }
      },
      null,
      { enableHighAccuracy: true }
    );
  };

  const handleStop = () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    router.push("/campus/map");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted">
        <LoadingSkeleton count={1} height="h-32" width="w-64" />
      </div>
    );
  }

  if (error) return <ErrorMessage message={error} />;
  if (!route) return <ErrorMessage message="No route available" />;

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Map View */}
      <NavigationMapView
        routeGeometry={route.geometry}
        userPosition={userPosition}
        nearestVertexIdx={progress?.nearestVertexIndex || 0}
        destination={destination}
      />

      {/* Top bar – close button */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/30 to-transparent pointer-events-none">
        <h2 className="text-white font-semibold text-lg">Navigation</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStop}
          className="pointer-events-auto bg-black/20 backdrop-blur text-white hover:bg-black/40"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Bottom Sheet – Navigation Info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-card rounded-t-2xl shadow-2xl border-t border-border overflow-hidden">
        {/* Drag handle / collapse toggle */}
        <button
          onClick={() => setExpandedSteps(!expandedSteps)}
          className="w-full py-2 flex justify-center hover:bg-muted transition-colors"
        >
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </button>

        <div className="px-4 pb-4 space-y-3">
          {/* Quick stats */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {progress
                  ? `${(progress.remainingDistance / 1000).toFixed(1)} km`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">remaining</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold flex items-center gap-1">
                <Clock className="w-5 h-5 text-primary" />
                {progress
                  ? `${Math.round(progress.remainingDuration / 60)} min`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">estimated time</p>
            </div>
          </div>

          {/* Next instruction */}
          {progress?.nextTurnInstruction && (
            <Card compact className="bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <Navigation2 className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  {progress.nextTurnInstruction}
                </p>
              </div>
            </Card>
          )}

          {/* Expandable step list */}
          {expandedSteps && route.steps && route.steps.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2 mt-2">
              {route.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{step.instruction}</p>
                    {step.distance && (
                      <p className="text-xs text-muted-foreground">
                        {step.distance < 1000
                          ? `${Math.round(step.distance)}m`
                          : `${(step.distance / 1000).toFixed(1)}km`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stop button */}
          <Button
            variant="destructive"
            onClick={handleStop}
            className="w-full"
          >
            Stop Navigation
          </Button>
        </div>
      </div>
    </div>
  );
}