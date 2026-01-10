// app/components/MessageContextMenu.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FiEdit2, FiTrash2, FiCopy, FiX } from "react-icons/fi";

type MessageContextMenuProps = {
  messageId: string;
  messageText: string;
  isMine: boolean;
  messageCreatedAt: string;
  onEdit: (messageId: string, currentText: string) => void;
  onDelete: (messageId: string, deleteForEveryone: boolean) => void;
  onClose: () => void;
  position: { x: number; y: number };
};

export default function MessageContextMenu({
  messageId,
  messageText,
  isMine,
  messageCreatedAt,
  onEdit,
  onDelete,
  onClose,
  position,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  // Check if message is within edit time (15 minutes)
  const canEdit = () => {
    if (!isMine) return false;
    const messageAge = Date.now() - new Date(messageCreatedAt).getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    return messageAge <= fifteenMinutes;
  };

  // Check if message is within delete for everyone time (7 minutes)
  const canDeleteForEveryone = () => {
    if (!isMine) return false;
    const messageAge = Date.now() - new Date(messageCreatedAt).getTime();
    const sevenMinutes = 7 * 60 * 1000;
    return messageAge <= sevenMinutes;
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    onClose();
  };

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Adjust menu position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 300),
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 min-w-[180px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {/* Close button for mobile */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <FiX size={16} />
      </button>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3"
      >
        <FiCopy size={16} className="text-gray-600" />
        <span>Copy</span>
      </button>

      {/* Edit (only for sender, within 15 min) */}
      {isMine && canEdit() && (
        <button
          onClick={() => {
            onEdit(messageId, messageText);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3"
        >
          <FiEdit2 size={16} className="text-blue-600" />
          <span>Edit</span>
        </button>
      )}

      {/* Delete */}
      {!showDeleteOptions ? (
        <button
          onClick={() => setShowDeleteOptions(true)}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-red-600"
        >
          <FiTrash2 size={16} />
          <span>Delete</span>
        </button>
      ) : (
        <div className="border-t border-gray-200 mt-2 pt-2">
          <p className="px-4 py-1 text-xs text-gray-500 font-semibold">Delete message for:</p>
          
          {/* Delete for me */}
          <button
            onClick={() => {
              onDelete(messageId, false);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Delete for me
          </button>

          {/* Delete for everyone (only sender, within 7 min) */}
          {isMine && canDeleteForEveryone() && (
            <button
              onClick={() => {
                onDelete(messageId, true);
                onClose();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
            >
              Delete for everyone
            </button>
          )}

          {/* Cancel */}
          <button
            onClick={() => setShowDeleteOptions(false)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 border-t border-gray-200 mt-2 pt-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}