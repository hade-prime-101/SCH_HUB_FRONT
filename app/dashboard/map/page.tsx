"use client";

/**
 * Campus Map Page
 * 
 * Simple thin wrapper that renders the new MapContainer orchestrator.
 * All logic (state, services, components) is handled by MapContainer and sub-components.
 */

import MapContainer from '@/components/dashboard/map/MapContainer';

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <MapContainer />
    </div>
  );
}
