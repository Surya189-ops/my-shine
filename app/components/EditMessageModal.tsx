// app/components/EditMessageModal.tsx - Modal for editing messages
"use client";

import { useState, useEffect, useRef } from "react";
import { FiX, FiCheck } from "react-icons/fi";

type EditMessageModalProps = {
  messageId: string;
  currentText: string;
  onSave: (messageId: string, newText: string) => void;
  onCancel: () => void;
};

export default function EditMessageModal({
  messageId,
  currentText,
  onSave,
  onCancel,
}: EditMessageModalProps) {
  const [editedText, setEditedText] = useState(currentText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus and select text
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleSave = () => {
    const trimmed = editedText.trim();
    if (!trimmed) {
      alert("Message cannot be empty");
      return;
    }
    if (trimmed === currentText) {
      onCancel();
      return;
    }
    onSave(messageId, trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Message</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
          rows={4}
          maxLength={1000}
        />

        {/* Character count */}
        <div className="text-right text-xs text-gray-400 mt-1">
          {editedText.length}/1000
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editedText.trim()}
            className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <FiCheck size={18} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}