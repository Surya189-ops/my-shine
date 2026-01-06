// app/components/ConnectionToast.tsx
"use client";

import { useEffect, useState } from "react";
import { FaTimes, FaCheck } from "react-icons/fa";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(7);
  const [isVisible, setIsVisible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTimeout = () => {
    setIsVisible(false);
    setTimeout(onTimeout, 300); // Wait for fade-out animation
  };

  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsVisible(false);
    setTimeout(() => onAccept(requestId), 300);
  };

  const handleReject = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsVisible(false);
    setTimeout(() => onReject(requestId), 300);
  };

  const handleProfileClick = () => {
    router.push(`/profile/${fromProfile._id}`);
  };

  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold":
        return "from-yellow-400 via-yellow-500 to-amber-500";
      case "silver":
        return "from-gray-300 via-gray-400 to-gray-500";
      case "bronze":
        return "from-orange-400 via-amber-600 to-orange-700";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-pink-200">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 7) * 100}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Profile Image with Tier Border */}
            <div
              onClick={handleProfileClick}
              className="relative cursor-pointer group"
            >
              <div
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${getTierColor(
                  fromProfile.tier
                )} p-[3px] group-hover:scale-105 transition-transform`}
              >
                <div
                  className="w-full h-full rounded-full bg-cover bg-center bg-gray-200"
                  style={{
                    backgroundImage: `url(${
                      fromProfile.imageUrl || "/placeholder.jpg"
                    })`,
                  }}
                />
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                <span
                  onClick={handleProfileClick}
                  className="hover:text-pink-600 cursor-pointer"
                >
                  {fromProfile.name}
                </span>{" "}
                wants to connect
              </p>
              <p className="text-xs text-gray-500">
                {fromProfile.age} • {fromProfile.gender} • {fromProfile.tier}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Dismisses in {timeLeft}s
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title="Reject"
              >
                <FaTimes size={16} />
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title="Accept"
              >
                <FaCheck size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}