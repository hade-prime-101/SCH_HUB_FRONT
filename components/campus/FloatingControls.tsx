"use client";

import { Crosshair, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/map/state/store";

export function FloatingControls() {
  const { position, isFollowing, setIsFollowing, animateToCamera } = useMapStore();

  const handleRecenter = () => {
    if (!position) return;
    animateToCamera({
      center: [position.lng, position.lat],
      zoom: 17,
      pitch: 45,
      bearing: -10,
    });
  };

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="absolute bottom-6 right-4 md:bottom-8 md:right-6 flex flex-col gap-2 z-10">
      <Button
        variant="secondary"
        size="icon"
        className="shadow-lg rounded-full h-12 w-12"
        onClick={handleRecenter}
        disabled={!position}
        aria-label="Recenter map to my location"
      >
        <Crosshair className="h-5 w-5" />
      </Button>
      <Button
        variant={isFollowing ? "default" : "secondary"}
        size="icon"
        className="shadow-lg rounded-full h-12 w-12"
        onClick={toggleFollow}
        disabled={!position}
        aria-label={isFollowing ? "Stop following my location" : "Follow my location"}
      >
        <Footprints className="h-5 w-5" />
      </Button>
    </div>
  );
}