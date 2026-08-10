"use client";

/**
 * GPSPermissionModal — Request GPS location permission from user
 * 
 * Shows when:
 * - App first loads (permission state is 'unknown')
 * - User explicitly asks to navigate
 * 
 * Content explains why we need location and shows the benefits.
 */

import { useCallback } from 'react';
import { X, Navigation, MapPin, Compass, Building2 } from 'lucide-react';

interface GPSPermissionModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onRequestPermission: () => Promise<void>;
  onDismiss: () => void;
}

export default function GPSPermissionModal({
  isOpen,
  isLoading = false,
  onRequestPermission,
  onDismiss,
}: GPSPermissionModalProps) {
  const handleRequest = useCallback(async () => {
    await onRequestPermission();
    // Don't auto-close — let parent handle it based on permission result
  }, [onRequestPermission]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-8 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:pb-0">
        <div className="w-full max-w-sm mx-auto bg-background rounded-3xl shadow-2xl overflow-hidden border border-border">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Enable Location</h2>
            <button
              onClick={onDismiss}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Illustration area */}
          <div className="bg-gradient-to-b from-primary/5 to-primary/10 flex flex-col items-center justify-center py-8 px-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 relative">
              <Navigation className="w-12 h-12 text-primary" />
              {/* Pulse animation rings */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
              <div className="absolute inset-4 rounded-full border-2 border-primary/20 animate-pulse animation-delay-200" />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <h3 className="text-lg font-bold text-foreground text-center mb-2">
              Get Walking Directions
            </h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
              SchHub needs your location to show where you are on the campus map and guide you with turn-by-turn directions to buildings, facilities, and more.
            </p>

            {/* Feature bullets */}
            <div className="flex flex-col gap-3 mb-6 bg-secondary/30 rounded-xl p-4">
              {[
                { icon: MapPin, text: 'See your live position on the map' },
                { icon: Navigation, text: 'Get turn-by-turn walking directions' },
                { icon: Building2, text: 'Find the nearest campus buildings' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">{text}</p>
                </div>
              ))}
            </div>

            {/* Privacy note */}
            <p className="text-xs text-muted-foreground text-center mb-6 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200/50 dark:border-amber-800/50">
              Your location is only used while navigating and is never stored or shared with other apps.
            </p>

            {/* Actions */}
            <button
              onClick={handleRequest}
              disabled={isLoading}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold text-sm mb-3 flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Allow Location Access
                </>
              )}
            </button>

            <button
              onClick={onDismiss}
              disabled={isLoading}
              className="w-full rounded-xl border border-border py-2.5 font-medium text-sm text-muted-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
