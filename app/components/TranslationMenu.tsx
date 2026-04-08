// app/components/TranslationMenu.tsx
"use client";

import { useEffect, useRef } from "react";
import { FiGlobe, FiX } from "react-icons/fi";

type TranslationMenuProps = {
  onTranslateAll: () => void;
  onSelectLanguage: () => void;
  onClose: () => void;
  isAutoTranslateEnabled: boolean;
  currentLanguage: string;
};

export default function TranslationMenu({
  onTranslateAll,
  onSelectLanguage,
  onClose,
  isAutoTranslateEnabled,
  currentLanguage,
}: TranslationMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute top-12 right-4 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 min-w-[220px] z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <FiGlobe size={16} className="text-pink-500" />
          <span className="text-sm font-semibold">Translation</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={16} />
        </button>
      </div>

      {/* Auto-translate status */}
      {isAutoTranslateEnabled && (
        <div className="px-4 py-2 bg-blue-50 text-xs text-blue-700">
          Auto-translating to {currentLanguage}
        </div>
      )}

      {/* Translate all chat */}
      <button
        onClick={onTranslateAll}
        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
      >
        <span>{isAutoTranslateEnabled ? "Stop translating" : "Translate all chat"}</span>
        {isAutoTranslateEnabled && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        )}
      </button>

      {/* Select language */}
      <button
        onClick={onSelectLanguage}
        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 border-t"
      >
        Translate into...
      </button>
    </div>
  );
}