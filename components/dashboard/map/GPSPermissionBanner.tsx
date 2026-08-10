"use client";

/**
 * GPSPermissionBanner — Inline banner in header for location permission
 * 
 * Shows when:
 * - Permission is denied or unknown
 * - Allows user to quickly enable from header
 */

import { Navigation, X, AlertCircle } from 'lucide-react';

interface GPSPermissionBannerProps {
  permissionState: 'granted' | 'denied' | 'unknown' | 'prompt';
  isLoading?: boolean;
  onRequestPermission: () => void;
  onDismiss: () => void;
}

export default function GPSPermissionBanner({
  permissionState,
  isLoading = false,
  onRequestPermission,
  onDismiss,
}: GPSPermissionBannerProps) {
  if (permissionState === 'granted') {
    return null; // Permission already granted
  }

  const isDenied = permissionState === 'denied';

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 border-b ${
        isDenied
          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/50'
          : 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/50'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isDenied ? (
          <AlertCircle
            className={`w-4 h-4 shrink-0 ${
              isDenied ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
            }`}
          />
        ) : (
          <Navigation
            className={`w-4 h-4 shrink-0 ${
              isDenied ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
            }`}
          />
        )}

        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-semibold ${
              isDenied ? 'text-amber-800 dark:text-amber-300' : 'text-blue-800 dark:text-blue-300'
            }`}
          >
            {isDenied ? 'Location access is blocked' : 'Enable location for directions'}
          </p>
          <p
            className={`text-xs ${
              isDenied ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'
            }`}
          >
            {isDenied
              ? 'Enable in browser settings to use navigation'
              : 'Tap to show your position on the map'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isDenied && (
          <button
            onClick={onRequestPermission}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95'
            }`}
          >
            {isLoading ? 'Requesting...' : 'Allow'}
          </button>
        )}

        <button
          onClick={onDismiss}
          className={`p-1.5 rounded-lg transition-colors ${
            isDenied
              ? 'hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
