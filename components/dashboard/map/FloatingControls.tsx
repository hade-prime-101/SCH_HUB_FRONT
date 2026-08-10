"use client";

/**
 * FloatingControls — Floating action buttons in map corners
 * 
 * Features:
 * - Recenter on user location (compass icon)
 * - Toggle follow mode (animated pulse when active)
 * - Layer toggles (building labels, etc.)
 * - Positioned in bottom-right by default
 */

import { useCallback, useState } from 'react';
import { Compass, Eye, EyeOff, Navigation, Layers } from 'lucide-react';

interface FloatingControlsProps {
  isFollowing: boolean;
  onRecenter: () => void;
  onToggleFollowMode: () => void;
  hasUserLocation: boolean;
}

export default function FloatingControls({
  isFollowing,
  onRecenter,
  onToggleFollowMode,
  hasUserLocation,
}: FloatingControlsProps) {
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [layers, setLayers] = useState({
    labels: true,
    buildings: true,
    roads: true,
  });

  const toggleLayer = useCallback((layer: keyof typeof layers) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  if (!hasUserLocation) {
    return null; // Don't show controls if we don't have user location
  }

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-10">
      {/* Layer menu (expandable) */}
      {showLayerMenu && (
        <div className="absolute bottom-20 right-0 bg-background border border-border rounded-lg shadow-lg overflow-hidden min-w-max">
          <div className="p-2 space-y-1">
            <button
              onClick={() => toggleLayer('labels')}
              className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm hover:bg-secondary transition-colors"
            >
              {layers.labels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Labels</span>
            </button>
            <button
              onClick={() => toggleLayer('buildings')}
              className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm hover:bg-secondary transition-colors"
            >
              {layers.buildings ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Buildings</span>
            </button>
            <button
              onClick={() => toggleLayer('roads')}
              className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm hover:bg-secondary transition-colors"
            >
              {layers.roads ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Roads</span>
            </button>
          </div>
        </div>
      )}

      {/* Layer toggle button */}
      <button
        onClick={() => setShowLayerMenu(!showLayerMenu)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-background border border-border shadow-md hover:shadow-lg hover:bg-secondary transition-all active:scale-95"
        title="Toggle layers"
      >
        <Layers className="w-5 h-5" />
      </button>

      {/* Follow mode toggle */}
      <button
        onClick={onToggleFollowMode}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full shadow-md transition-all active:scale-95
          ${
            isFollowing
              ? 'bg-primary text-primary-foreground hover:shadow-lg hover:bg-primary/90 relative'
              : 'bg-background border border-border hover:shadow-lg hover:bg-secondary'
          }
        `}
        title={isFollowing ? 'Following enabled' : 'Enable following'}
      >
        {isFollowing && (
          <>
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-primary animate-pulse opacity-25" />
            <span className="absolute inset-0 rounded-full bg-primary animate-pulse opacity-25 animation-delay-200" />
          </>
        )}
        <Navigation className="w-5 h-5 relative z-10" />
      </button>

      {/* Recenter button */}
      <button
        onClick={onRecenter}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-background border border-border shadow-md hover:shadow-lg hover:bg-secondary transition-all active:scale-95"
        title="Recenter on your location"
      >
        <Compass className="w-5 h-5" />
      </button>
    </div>
  );
}
