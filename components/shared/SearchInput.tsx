import { MdSearch } from "react-icons/md";

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ placeholder, value, onChange }: SearchInputProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}
