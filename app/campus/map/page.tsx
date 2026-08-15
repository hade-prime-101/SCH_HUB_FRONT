"use client";

import dynamic from "next/dynamic";

// Lazy load MapContainer to avoid SSR issues with map libraries
const MapContainer = dynamic(
  () => import("@/components/campus/MapContainer"),
  { ssr: false }
);

export default function CampusMapPage() {
  return (
    <div className="h-screen w-full">
      <MapContainer />
    </div>
  );
}