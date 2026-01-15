
// FILE 2: app/components/ConnectedToast.tsx

"use client";

import { useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";

interface ConnectedToastProps {
  onClose: () => void;
}

export default function ConnectedToast({ onClose }: ConnectedToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-close after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md transition-all duration-300 ${
        isVisible 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 -translate-y-4 scale-95"
      }`}
    >
      {/* Outer glow effect */}
      <div className="absolute inset-0 bg-green-400 blur-xl opacity-50 rounded-2xl"></div>
      
      {/* Main toast */}
      <div className="relative bg-gradient-to-br from-white via-green-50 to-white rounded-2xl shadow-2xl overflow-hidden border border-green-200">
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 opacity-20 animate-pulse"></div>
        
        {/* Content */}
        <div className="relative p-5">
          <div className="flex items-center gap-4">
            {/* Animated check icon with rings */}
            <div className="relative flex-shrink-0">
              {/* Pulsing rings */}
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30"></div>
              <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse"></div>
              
              {/* Main icon */}
              <div className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <FiCheck className="text-white" size={28} strokeWidth={3} />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-0.5">
                Connected! 🎉
              </p>
              <p className="text-sm text-gray-600 font-medium">
                Opening chat...
              </p>
            </div>

            {/* Sparkle decoration */}
            <div className="flex-shrink-0 text-2xl animate-bounce">
              ✨
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400"></div>
      </div>
    </div>
  );
}

