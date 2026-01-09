// app/components/SearchBar.tsx
"use client";

import { FiSearch, FiX } from "react-icons/fi";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
        <FiSearch className="text-gray-400" size={16} />
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
        />
        
        {value && (
          <button
            onClick={() => onChange("")}
            className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <FiX className="text-gray-400" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}