// app/components/ImagePicker.tsx - Image picker with view-once option
"use client";

import { useState, useRef } from "react";
import { FiImage, FiX, FiSend, FiEye } from "react-icons/fi";

type ImagePickerProps = {
  onImageSelect: (imageData: {
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    isViewOnce: boolean;
    caption?: string;
  }) => void;
  onCancel: () => void;
};

export default function ImagePicker({ onImageSelect, onCancel }: ImagePickerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [caption, setCaption] = useState("");
  const [isViewOnce, setIsViewOnce] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setSelectedImage(base64);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    if (!selectedImage || !imageDimensions) return;

    onImageSelect({
      imageUrl: selectedImage,
      imageWidth: imageDimensions.width,
      imageHeight: imageDimensions.height,
      isViewOnce,
      caption: caption.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setCaption("");
    setIsViewOnce(false);
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black bg-opacity-50">
        <button onClick={handleCancel} className="text-white p-2 hover:bg-white hover:bg-opacity-10 rounded-full">
          <FiX size={24} />
        </button>
        
        <h3 className="text-white font-semibold">
          {selectedImage ? "Preview" : "Select Image"}
        </h3>
        
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Image Preview or Picker */}
      <div className="flex-1 flex items-center justify-center p-4">
        {selectedImage ? (
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-4 text-white p-8 border-2 border-dashed border-white border-opacity-30 rounded-lg hover:border-opacity-50 transition-colors"
          >
            <FiImage size={48} />
            <span className="text-lg">Select an image</span>
            <span className="text-sm text-gray-400">Max size: 5MB</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Controls (only show when image is selected) */}
      {selectedImage && (
        <div className="bg-black bg-opacity-50 p-4 space-y-3">
          {/* View Once Toggle */}
          <button
            onClick={() => setIsViewOnce(!isViewOnce)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              isViewOnce 
                ? "bg-pink-500 text-white" 
                : "bg-white bg-opacity-10 text-white hover:bg-opacity-20"
            }`}
          >
            <div className="flex items-center gap-3">
              <FiEye size={20} />
              <div className="text-left">
                <p className="font-semibold">View Once</p>
                <p className="text-xs opacity-75">Photo will disappear after being viewed</p>
              </div>
            </div>
            
            <div className={`w-12 h-6 rounded-full transition-colors relative ${
              isViewOnce ? "bg-pink-600" : "bg-gray-600"
            }`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isViewOnce ? "translate-x-6" : ""
              }`} />
            </div>
          </button>

          {/* Caption Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="flex-1 px-4 py-3 bg-white bg-opacity-10 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:bg-opacity-20"
              maxLength={200}
            />
            
            {/* Send Button */}
            <button
              onClick={handleSend}
              className="bg-pink-500 text-white p-3 rounded-full hover:bg-pink-600 transition-colors"
            >
              <FiSend size={20} />
            </button>
          </div>

          {/* Change Image Button */}
          <button
            onClick={() => {
              setSelectedImage(null);
              fileInputRef.current?.click();
            }}
            className="w-full px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg hover:bg-opacity-20 transition-colors text-sm"
          >
            Choose Different Image
          </button>
        </div>
      )}
    </div>
  );
}