"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ArrowLeft, Navigation, MapPin, Building2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import BackButton from "@/components/shared/BackButton";
import { getFeature, getFeatureEntrances } from "@/lib/api/campus-map.api";
import type { MapFeature } from "@/types/campus-map";

export default function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [feature, setFeature] = useState<MapFeature | null>(null);
  const [entrances, setEntrances] = useState<MapFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [f, ent] = await Promise.all([
          getFeature(id),
          getFeatureEntrances(id),
        ]);
        setFeature(f);
        setEntrances(ent);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feature");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted px-4 py-6">
        <LoadingSkeleton count={3} height="h-20" />
      </div>
    );
  }

  if (error) return <ErrorMessage message={error} />;
  if (!feature) return <ErrorMessage message="Feature not found" />;

  const handleNavigate = () => {
    // Use the feature's coordinates (assuming it's a Point)
    const coords = feature.geometry.coordinates as [number, number];
    // Navigate to map with destination set
    router.push(
      `/campus/map?destination=${coords[1]},${coords[0]}&name=${encodeURIComponent(
        feature.properties.name
      )}`
    );
  };

  return (
    <div className="min-h-screen bg-muted pb-24">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <BackButton variant="icon" />
        <h1 className="text-xl font-bold text-foreground truncate">
          {feature.properties.name}
        </h1>
      </div>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
        {/* Main card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-2xl">{feature.properties.name}</CardTitle>
              <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                {feature.properties.category}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {feature.properties.building || "Building"} ·{" "}
              {feature.properties.floor || "Ground"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-foreground">
                {feature.properties.description || "No description available."}
              </p>
            </div>

            {/* Additional metadata */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Category</span>
                <p className="font-medium">{feature.properties.category}</p>
              </div>
              <div className="bg-muted rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Building</span>
                <p className="font-medium">{feature.properties.building || "—"}</p>
              </div>
              <div className="bg-muted rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Floor</span>
                <p className="font-medium">{feature.properties.floor || "—"}</p>
              </div>
              <div className="bg-muted rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Entrance ID</span>
                <p className="font-medium">{feature.properties.entranceId || "—"}</p>
              </div>
            </div>

            {/* Entrances */}
            {entrances.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Entrances
                </h3>
                <div className="space-y-2">
                  {entrances.map((ent) => (
                    <div
                      key={ent.id}
                      className="flex items-center justify-between bg-muted rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{ent.properties.name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">
                          {ent.properties.entranceId && `ID: ${ent.properties.entranceId}`}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/campus/map?destination=${ent.geometry.coordinates[1]},${ent.geometry.coordinates[0]}&name=${encodeURIComponent(
                              ent.properties.name || "Entrance"
                            )}`
                          )
                        }
                      >
                        Navigate
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary CTA */}
            <Button
              onClick={handleNavigate}
              className="w-full py-6 text-base"
              size="lg"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Navigate Here
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}