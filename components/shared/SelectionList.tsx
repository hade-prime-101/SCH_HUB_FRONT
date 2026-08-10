import { MdCheckCircle, MdNavigateNext } from "react-icons/md";

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
            className="p-4 rounded-xl bg-slate-100 animate-pulse h-16"
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
              ? "border-indigo-600 bg-indigo-50"
              : "border-slate-200 hover:border-indigo-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 text-indigo-600">{item.icon}</div>
              <div>
                <h3 className="font-semibold text-slate-900">{item.name}</h3>
                {item.code && (
                  <p className="text-sm text-slate-500">{item.code}</p>
                )}
              </div>
            </div>
            {selectedId === item.id ? (
              <MdCheckCircle className="w-6 h-6 text-indigo-600" />
            ) : (
              <MdNavigateNext className="w-6 h-6 text-slate-400" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
