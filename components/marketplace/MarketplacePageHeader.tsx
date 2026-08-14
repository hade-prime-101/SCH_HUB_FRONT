import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
interface MarketplacePageHeaderProps {
  title: string;
  description?: string;
  createLabel?: string;
  onCreate?: () => void;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function MarketplacePageHeader({
  title,
  description,
  createLabel,
  onCreate,
  showSearch = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
}: MarketplacePageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="h-10 w-48 rounded-lg border border-border bg-background pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}
        {createLabel && onCreate && (
          <Button onClick={onCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            {createLabel}
          </Button>
        )}
      </div>
    </div>
  );
}