// app/components/ImageViewer.tsx - Full-screen image viewer
"use client";

import { FiX, FiDownload } from "react-icons/fi";

type ImageViewerProps = {
  imageUrl: string;
  caption?: string;
  isViewOnce?: boolean;
  isSender?: boolean; // Is the current viewer the sender?
  onClose: () => void;
  onViewed?: () => void; // Callback when view-once image is opened
};

export default function ImageViewer({
  imageUrl,
  caption,
  isViewOnce = false,
  isSender = false,
  onClose,
  onViewed,
}: ImageViewerProps) {
  // Mark as viewed when component mounts (only for view-once AND if receiver)
  if (isViewOnce && !isSender && onViewed) {
    onViewed();
  }

  const handleDownload = () => {
    // Don't allow download for view-once images
    if (isViewOnce) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `myshine-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black bg-opacity-50">
        <button
          onClick={onClose}
          className="text-white p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
        >
          <FiX size={24} />
        </button>

        {isViewOnce && (
          <div className="flex items-center gap-2 bg-pink-500 px-3 py-1.5 rounded-full">
            <span className="text-white text-sm font-semibold">👁️ View Once</span>
          </div>
        )}

        {!isViewOnce && (
          <button
            onClick={handleDownload}
            className="text-white p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
          >
            <FiDownload size={20} />
          </button>
        )}
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={imageUrl}
          alt="Full view"
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Caption */}
      {caption && (
        <div className="bg-black bg-opacity-50 px-6 py-4 text-center">
          <p className="text-white text-sm">{caption}</p>
        </div>
      )}

      {/* View Once Warning */}
      {isViewOnce && (
        <div className="bg-pink-500 bg-opacity-20 border-t border-pink-500 px-6 py-3 text-center">
          <p className="text-pink-300 text-xs">
            {isSender 
              ? "Recipient can view this photo only once"
              : "This photo will disappear after you close it"
            }
          </p>
        </div>
      )}
    </div>
  );
}