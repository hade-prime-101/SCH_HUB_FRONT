"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCategoriesSorted } from "@/lib/map/config/categories";
import { LocationType } from "@/lib/map/types/location";
import type { MapViewMode } from "@/lib/map/types/map";

interface MapHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: LocationType | "ALL";
  onFilterChange: (filter: LocationType | "ALL") => void;
  viewMode?: MapViewMode;
  onViewModeChange?: (mode: MapViewMode) => void;
  isLoading?: boolean;
}

export function MapHeader({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  isLoading = false,
}: MapHeaderProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const categories = getCategoriesSorted();

  // Sync local state with prop when searchQuery changes externally
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange]
  );

  const clearSearch = useCallback(() => {
    setLocalQuery("");
    onSearchChange("");
  }, [onSearchChange]);

  return (
    <header className="flex flex-col gap-2 p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search campus locations..."
            value={localQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-8 h-9"
            disabled={isLoading}
          />
          {localQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Optional view mode toggle if needed */}
        {onViewModeChange && viewMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onViewModeChange(viewMode === "map" ? "list" : "map")
            }
            className="hidden md:inline-flex"
          >
            {viewMode === "map" ? "List" : "Map"}
          </Button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        <Button
          variant={activeFilter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("ALL")}
          className="whitespace-nowrap"
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.type}
            variant={activeFilter === cat.type ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(cat.type)}
            className="whitespace-nowrap"
          >
            {cat.label}
          </Button>
        ))}
      </div>
    </header>
  );
}