import { CheckCircle2, ChevronRight } from "lucide-react";

export interface SelectionItem {
  id: string;
  name: string;
  code?: string;
  icon: React.ReactNode;
}

interface SelectionListProps {
  items: SelectionItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filterQuery: string;
  isLoading: boolean;
}

/**
 * SelectionList Component
 * 
 * Displays a list of selectable items with icon, name, and optional code.
 * Uses semantic tokens for consistent styling across themes.
 * 
 * States:
 * - Selected: primary border, accent background
 * - Default: muted border
 * - Hover: primary border
 * - Loading: skeleton placeholders
 * 
 * @example
 * ```tsx
 * <SelectionList
 *   items={schools}
 *   selectedId={selectedSchoolId}
 *   onSelect={setSelectedSchoolId}
 *   filterQuery={query}
 *   isLoading={isLoading}
 * />
 * ```
 */
export function SelectionList({
  items,
  selectedId,
  onSelect,
  filterQuery,
  isLoading,
}: SelectionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-muted animate-pulse h-16"
          />
        ))}
      </div>
    );
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(filterQuery) ||
      (item.code?.toLowerCase().includes(filterQuery) ?? false)
  );

  return (
    <div className="space-y-3">
      {filteredItems.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
            selectedId === item.id
              ? "border-primary bg-accent"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 text-primary">{item.icon}</div>
              <div>
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                {item.code && (
                  <p className="text-sm text-muted-foreground">{item.code}</p>
                )}
              </div>
            </div>
            {selectedId === item.id ? (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            ) : (
              <ChevronRight className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
