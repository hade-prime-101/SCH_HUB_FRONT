"use client";

/**
 * MapHeader — Search bar, category filters, and view mode toggle
 * 
 * Features:
 * - Debounced search input
 * - Category filter pills (ALL, BUILDING, CLASSROOM, etc.)
 * - View mode toggle (map vs navigate)
 * - Active filter highlight
 * - Loading indicator
 */

import { useState, useCallback, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { LocationType } from '@/lib/map';

interface MapHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
  onFilterChange: (filter: LocationType | 'ALL') => void | Promise<void>;
  viewMode: 'map' | 'navigate';
  onViewModeChange: (mode: 'map' | 'navigate') => void;
  isLoading?: boolean;
}

// Category filters to display
const CATEGORY_FILTERS: Array<{ id: LocationType | 'ALL'; label: string; icon: string }> = [
  { id: 'ALL', label: 'All', icon: '🗺️' },
  { id: 'BUILDING', label: 'Buildings', icon: '🏢' },
  { id: 'LIBRARY', label: 'Library', icon: '📖' },
  { id: 'CAFETERIA', label: 'Cafeteria', icon: '🍽️' },
  { id: 'LAB', label: 'Labs', icon: '🧪' },
  { id: 'PARKING', label: 'Parking', icon: '🚗' },
];

export default function MapHeader({
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

  /**
   * Handle search input with debounce
   */
  const handleSearchInput = useCallback(
    (value: string) => {
      setLocalQuery(value);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce search to 300ms
      debounceRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange],
  );

  /**
   * Clear search query
   */
  const handleClearSearch = useCallback(() => {
    setLocalQuery('');
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <header className="flex flex-col gap-3 bg-background border-b border-border p-4 z-10 shadow-sm">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search locations..."
            value={localQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-input bg-background text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {localQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
          )}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scroll-smooth">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap text-sm font-medium
              transition-all shrink-0
              ${
                activeFilter === filter.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }
            `}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
          </button>
        ))}
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>Tap a location to view details and navigate</span>
      </div>
    </header>
  );
}
