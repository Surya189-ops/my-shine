// app/components/ChatSearch.tsx - In-Chat Message Search
"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiX, FiChevronUp, FiChevronDown } from "react-icons/fi";

interface Message {
  _id: string;
  text: string;
  senderProfileId: string;
  receiverProfileId: string;
  createdAt: string;
}

interface ChatSearchProps {
  messages: Message[];
  onResultClick: (messageId: string) => void;
  onClose: () => void;
}

export default function ChatSearch({
  messages,
  onResultClick,
  onClose,
}: ChatSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = messages.filter((msg) =>
      msg.text.toLowerCase().includes(query)
    );
    setSearchResults(results);
    setCurrentResultIndex(0);

    // Automatically show first result
    if (results.length > 0) {
      onResultClick(results[0]._id);
    }
  }, [searchQuery, messages]);

  const handlePrevious = () => {
    if (searchResults.length === 0) return;
    const newIndex =
      currentResultIndex > 0
        ? currentResultIndex - 1
        : searchResults.length - 1;
    setCurrentResultIndex(newIndex);
    onResultClick(searchResults[newIndex]._id);
  };

  const handleNext = () => {
    if (searchResults.length === 0) return;
    const newIndex =
      currentResultIndex < searchResults.length - 1
        ? currentResultIndex + 1
        : 0;
    setCurrentResultIndex(newIndex);
    onResultClick(searchResults[newIndex]._id);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchResults([]);
    setCurrentResultIndex(0);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3 shadow-sm">
      <div className="flex items-center gap-2">
        {/* Search Icon */}
        <FiSearch className="text-pink-500 text-lg flex-shrink-0" />

        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
          autoFocus
        />

        {/* Results Counter */}
        {searchResults.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-600 font-medium">
              {currentResultIndex + 1} of {searchResults.length}
            </span>

            {/* Navigation Buttons */}
            <button
              onClick={handlePrevious}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={searchResults.length === 0}
            >
              <FiChevronUp className="text-gray-600" size={16} />
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={searchResults.length === 0}
            >
              <FiChevronDown className="text-gray-600" size={16} />
            </button>
          </div>
        )}

        {/* Clear Button */}
        {searchQuery && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          >
            <FiX className="text-gray-500" size={16} />
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
        >
          <FiX className="text-gray-600 text-lg" />
        </button>
      </div>

      {/* No Results Message */}
      {searchQuery && searchResults.length === 0 && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          No messages found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}