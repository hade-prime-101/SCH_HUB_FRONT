"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;   // px to pull before triggering (default 80)
  resistance?: number;  // how much to resist the pull (default 2.5)
}

interface PullToRefreshState {
  pulling: boolean;
  refreshing: boolean;
  pullDistance: number; // 0–1 (clamped progress toward threshold)
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions): {
  containerRef: React.RefObject<HTMLDivElement>;
  state: PullToRefreshState;
} {
  const containerRef = useRef<HTMLDivElement>(null!);
  const startY       = useRef<number>(0);
  const currentY     = useRef<number>(0);
  const isPulling    = useRef<boolean>(false);

  const [state, setState] = useState<PullToRefreshState>({
    pulling:      false,
    refreshing:   false,
    pullDistance: 0,
  });

  const isAtTop = useCallback(() => {
    const el = containerRef.current;
    return !el || el.scrollTop <= 0;
  }, []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (!isAtTop()) return;
    startY.current  = e.touches[0].clientY;
    currentY.current = startY.current;
    isPulling.current = true;
  }, [isAtTop]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || !isAtTop()) return;
    currentY.current = e.touches[0].clientY;
    const delta = (currentY.current - startY.current) / resistance;

    if (delta > 0) {
      // Prevent native scroll bounce while pulling
      e.preventDefault();
      setState((prev) => ({
        ...prev,
        pulling:      true,
        pullDistance: Math.min(delta / threshold, 1),
      }));
    }
  }, [isAtTop, resistance, threshold]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    const delta = (currentY.current - startY.current) / resistance;

    if (delta >= threshold) {
      setState({ pulling: false, refreshing: true, pullDistance: 1 });
      try {
        await onRefresh();
      } finally {
        setState({ pulling: false, refreshing: false, pullDistance: 0 });
      }
    } else {
      setState({ pulling: false, refreshing: false, pullDistance: 0 });
    }
  }, [onRefresh, resistance, threshold]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false });
    el.addEventListener("touchend",   onTouchEnd,   { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  return { containerRef, state };
}
