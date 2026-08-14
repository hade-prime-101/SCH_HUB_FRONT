"use client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useRef } from "react";
import { usePullToRefresh } from "@/lib/hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
}

export default function PullToRefresh({
  onRefresh,
  children,
  className,
}: PullToRefreshProps) {
  const { containerRef, state } = usePullToRefresh({ onRefresh });
  const { pulling, refreshing, pullDistance } = state;

  const isActive    = pulling || refreshing;
  // Indicator drops in from top as you pull — max 56px
  const translateY  = isActive ? Math.round(pullDistance * 56) : 0;
  // Spinner rotation follows pull progress (0 → 270 deg), then spins freely
  const rotation    = refreshing ? undefined : Math.round(pullDistance * 270);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto h-full ${className ?? ""}`}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* ── Pull indicator ── */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 flex justify-center z-50"
        style={{
          transform:  `translateY(${translateY - 56}px)`,
          transition: refreshing || !pulling ? "transform 0.25s cubic-bezier(0.4,0,0.2,1)" : "none",
          willChange: "transform",
        }}
      >
        <div
          className={`mt-3 w-10 h-10 rounded-full bg-card shadow-md border border-border flex items-center justify-center transition-opacity duration-200 ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Arc SVG — fills as you pull, then spins when refreshing */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            className={refreshing ? "animate-refresh" : ""}
            style={
              !refreshing && rotation !== undefined
                ? { transform: `rotate(${rotation}deg)` }
                : undefined
            }
          >
            {/* Track */}
            <circle
              cx="11" cy="11" r="8"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-border"
            />
            {/* Progress arc */}
            <circle
              cx="11" cy="11" r="8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 8}`}
              strokeDashoffset={`${2 * Math.PI * 8 * (1 - (refreshing ? 0.75 : pullDistance))}`}
              className="text-primary transition-all"
              style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
            />
          </svg>
        </div>
      </div>

      {/* ── Page content — pushed down while pulling ── */}
      <div
        style={{
          transform:  `translateY(${translateY}px)`,
          transition: refreshing || !pulling ? "transform 0.25s cubic-bezier(0.4,0,0.2,1)" : "none",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
