
// FILE 1: app/components/ConnectionToast.tsx

"use client";

import { useEffect, useState } from "react";
import { FiX, FiCheck } from "react-icons/fi";

interface ConnectionToastProps {
  fromProfile: {
    _id: string;
    name: string;
    imageUrl?: string;
    age: number;
    gender: string;
    tier: string;
  };
  requestId: string;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onTimeout: () => void;
}

export default function ConnectionToast({
  fromProfile,
  requestId,
  onAccept,
  onReject,
  onTimeout,
}: ConnectionToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(7);

  useEffect(() => {
    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTimeout = () => {
    setIsVisible(false);
    setTimeout(() => {
      onTimeout();
    }, 300);
  };

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(() => {
      onAccept(requestId);
    }, 300);
  };

  const handleReject = () => {
    setIsVisible(false);
    setTimeout(() => {
      onReject(requestId);
    }, 300);
  };

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md transition-all duration-300 ${
        isVisible 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 -translate-y-4 scale-95"
      }`}
    >
      {/* Outer glow */}
      <div className="absolute inset-0 bg-pink-400 blur-xl opacity-40 rounded-2xl"></div>
      
      {/* Main toast */}
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Animated progress bar */}
        <div className="h-1.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 transition-all duration-1000 ease-linear shadow-sm"
            style={{ width: `${(timeLeft / 7) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Profile Image with glow */}
            <div className="relative flex-shrink-0">
              {/* Pulsing glow ring */}
              <div className="absolute inset-0 bg-pink-400 rounded-full blur-md animate-pulse opacity-40"></div>
              
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden border-2 border-white shadow-lg">
                {fromProfile.imageUrl ? (
                  <img
                    src={fromProfile.imageUrl}
                    alt={fromProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {fromProfile.gender === "male" ? "👨" : "👩"}
                  </div>
                )}
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-800 truncate mb-0.5">
                {fromProfile.name} wants to connect
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {timeLeft}s to respond • Tap to accept or reject
              </p>
            </div>

            {/* Action Buttons with hover effects */}
            <div className="flex gap-2.5 flex-shrink-0">
              {/* Reject Button */}
              <button
                onClick={handleReject}
                className="relative w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 group"
                title="Reject"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-red-400 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
                <FiX className="relative text-white" size={22} strokeWidth={2.5} />
              </button>

              {/* Accept Button */}
              <button
                onClick={handleAccept}
                className="relative w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 group"
                title="Accept"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
                <FiCheck className="relative text-white" size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom gradient accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>
    </div>
  );
}

