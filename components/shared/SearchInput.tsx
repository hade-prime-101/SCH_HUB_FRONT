import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * SearchInput Component
 * 
 * Search input field with leading icon and semantic styling.
 * Uses design tokens for consistent appearance across themes.
 * 
 * Features:
 * - Leading search icon
 * - Semantic border and background colors
 * - Focus ring with primary color
 * - Auto-lowercase value normalization
 * 
 * @example
 * ```tsx
 * <SearchInput
 *   placeholder="Search schools..."
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 * />
 * ```
 */
export function SearchInput({ placeholder, value, onChange }: SearchInputProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-muted placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}
