"use client";

/**
 * NavigationPanel — Full-screen navigation view with turn-by-turn directions
 * 
 * Features:
 * - Large map with route highlighted
 * - Next turn instruction
 * - Distance and ETA to destination
 * - Turn-by-turn list (swipe-able on mobile)
 * - Stop navigation button
 * - Live progress tracking
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, X, Navigation2, Clock, Gauge } from 'lucide-react';

import { Route } from '@/lib/map';
import MapCanvas from './MapCanvas';

interface NavigationPanelProps {
  route: Route;
  userLocation?: { lat: number; lng: number };
  onStop: () => void;
  onExit: () => void;
}

export default function NavigationPanel({
  route,
  userLocation,
  onStop,
  onExit,
}: NavigationPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Get current turn instruction
  const currentStep = useMemo(() => {
    if (!route.steps || route.steps.length === 0) return null;
    return route.steps[currentStepIndex];
  }, [route.steps, currentStepIndex]);

  // Calculate remaining distance and time
  const remaining = useMemo(() => {
    if (!route.steps) return { distance: 0, duration: 0 };

    const stepsRemaining = route.steps.slice(currentStepIndex);
    const distance = stepsRemaining.reduce((sum, step) => sum + (step.distance || 0), 0);
    const duration = stepsRemaining.reduce((sum, step) => sum + (step.duration || 0), 0);

    return { distance, duration };
  }, [route.steps, currentStepIndex]);

  // Format distance
  const formattedDistance = useMemo(() => {
    const meters = remaining.distance;
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }, [remaining.distance]);

  // Format ETA
  const formattedETA = useMemo(() => {
    const minutes = Math.ceil(remaining.duration / 60);
    if (minutes < 1) return '< 1 min';
    if (minutes === 1) return '1 min';
    return `${minutes} mins`;
  }, [remaining.duration]);

  // Get turn instruction text
  const getTurnInstruction = (instruction?: string) => {
    if (!instruction) return 'Continue';

    // Parse instruction to extract key info
    const match = instruction.match(/(.+?)(?: (?:on|onto) (.+))?$/);
    if (match) {
      return match[1];
    }
    return instruction;
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Map takes full screen */}
      <div className="flex-1 relative">
        <MapCanvas
          locations={[]}
          selectedLocation={null}
          onSelectLocation={() => {}}
          userLocation={userLocation}
          currentRoute={route}
        />

        {/* Top bar with exit button */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/20 to-transparent z-20 pointer-events-none">
          <h2 className="text-lg font-semibold text-white">Navigation</h2>
          <button
            onClick={onExit}
            className="p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors pointer-events-auto"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Current instruction banner */}
        {currentStep && (
          <div className="absolute top-20 inset-x-0 mx-4 p-4 rounded-lg bg-primary text-primary-foreground shadow-lg z-20">
            <div className="flex items-start gap-3">
              <Navigation2 className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium opacity-90">{getTurnInstruction(currentStep.instruction)}</p>
                {currentStep.distance && (
                  <p className="text-xs mt-1 opacity-75">
                    {currentStep.distance < 1000
                      ? `${Math.round(currentStep.distance)}m`
                      : `${(currentStep.distance / 1000).toFixed(1)}km`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet - Navigation info */}
      <div className="bg-background border-t border-border shadow-xl">
        {/* Collapse/expand handle */}
        <button
          onClick={() => setExpandedSteps(!expandedSteps)}
          className="w-full flex items-center justify-center py-2 hover:bg-secondary/50 transition-colors"
        >
          {expandedSteps ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {!expandedSteps ? (
          // Collapsed state - Quick info
          <div className="px-4 pb-4">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <p className="text-3xl font-bold">{formattedDistance}</p>
                <p className="text-xs text-muted-foreground">remaining</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formattedETA}
                </p>
                <p className="text-xs text-muted-foreground">estimated time</p>
              </div>
            </div>

            <button
              onClick={onStop}
              className="w-full py-2.5 px-4 rounded-lg border border-destructive text-destructive font-medium text-sm hover:bg-destructive/10 transition-colors"
            >
              Stop Navigation
            </button>
          </div>
        ) : (
          // Expanded state - Full turn list
          <div className="max-h-[50vh] overflow-y-auto px-4 pb-4">
            <div className="mb-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold">{formattedDistance}</p>
                  <p className="text-xs text-muted-foreground">remaining</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formattedETA}
                  </p>
                </div>
              </div>
            </div>

            {/* Turn list */}
            <div className="space-y-2 mb-4">
              {route.steps && route.steps.length > 0 ? (
                route.steps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`
                      w-full text-left p-3 rounded-lg border transition-all
                      ${
                        idx === currentStepIndex
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary hover:bg-secondary/80 border-border text-secondary-foreground'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-background/50 font-medium text-xs">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight">
                          {getTurnInstruction(step.instruction)}
                        </p>
                        {step.distance && (
                          <p className="text-xs opacity-75 mt-1">
                            {step.distance < 1000
                              ? `${Math.round(step.distance)}m`
                              : `${(step.distance / 1000).toFixed(1)}km`}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No steps available</p>
              )}
            </div>

            <button
              onClick={onStop}
              className="w-full py-2.5 px-4 rounded-lg border border-destructive text-destructive font-medium text-sm hover:bg-destructive/10 transition-colors"
            >
              Stop Navigation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
