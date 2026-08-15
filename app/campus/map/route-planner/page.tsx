"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Navigation, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackButton from "@/components/shared/BackButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { calculateSimpleRoute } from "@/lib/api/campus-map.api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { RouteResponse } from "@/types/campus-map";

export default function RoutePlannerPage() {
  const router = useRouter();
  const [from, setFrom] = useState({ lat: "", lng: "" });
  const [to, setTo] = useState({ lat: "", lng: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fromLat = parseFloat(from.lat);
    const fromLng = parseFloat(from.lng);
    const toLat = parseFloat(to.lat);
    const toLng = parseFloat(to.lng);

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      setError("Please enter valid coordinates (numbers).");
      setLoading(false);
      return;
    }

    try {
      const route = await calculateSimpleRoute({
        fromLat,
        fromLng,
        toLat,
        toLng,
        profile: "foot",
      });
      // Pass route data to navigate page via query params or state
      // For simplicity, we encode route as JSON in URL (not ideal for large routes)
      // In practice, we'd use a global store or context.
      router.push(
        `/campus/map/navigate?route=${encodeURIComponent(JSON.stringify(route))}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate route");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted pb-24">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <BackButton variant="icon" />
        <h1 className="text-xl font-bold text-foreground">Plan Route</h1>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Start (latitude, longitude)
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Latitude"
                    value={from.lat}
                    onChange={(e) => setFrom({ ...from, lat: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Longitude"
                    value={from.lng}
                    onChange={(e) => setFrom({ ...from, lng: e.target.value })}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setFrom({
                            lat: pos.coords.latitude.toString(),
                            lng: pos.coords.longitude.toString(),
                          });
                        },
                        () => setError("Unable to get location")
                      );
                    }
                  }}
                >
                  <MapPin className="w-4 h-4 mr-1" /> Use my location
                </Button>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Destination (latitude, longitude)
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Latitude"
                    value={to.lat}
                    onChange={(e) => setTo({ ...to, lat: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Longitude"
                    value={to.lng}
                    onChange={(e) => setTo({ ...to, lng: e.target.value })}
                    required
                  />
                </div>
              </div>

              {error && <ErrorMessage message={error} />}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating…
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Route
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}