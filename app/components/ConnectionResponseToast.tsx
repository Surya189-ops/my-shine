// app/components/ConnectionResponseToast.tsx
"use client";

import { useEffect, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface ConnectionResponseToastProps {
  fromProfileId: string;
  fromName: string;
  action: "accepted" | "rejected";
  onClose: () => void;
}

export default function ConnectionResponseToast({
  fromProfileId,
  fromName,
  action,
  onClose,
}: ConnectionResponseToastProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleChatClick = () => {
    if (action === "accepted") {
      setIsVisible(false);
      setTimeout(() => {
        router.push(`/chat/${fromProfileId}`);
      }, 300);
    }
  };

  const isAccepted = action === "accepted";

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div
        className={`rounded-xl shadow-2xl overflow-hidden border-2 ${
          isAccepted
            ? "bg-white border-green-200"
            : "bg-white border-red-200"
        }`}
      >
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isAccepted
                ? "bg-gradient-to-r from-green-500 to-green-600"
                : "bg-gradient-to-r from-red-500 to-red-600"
            }`}
            style={{ width: `${(timeLeft / 5) * 100}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isAccepted ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isAccepted ? (
                <FaCheck size={24} className="text-green-600" />
              ) : (
                <FaTimes size={24} className="text-red-600" />
              )}
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {isAccepted ? "Connection Accepted! 🎉" : "Connection Rejected"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                <span className="font-medium">{fromName}</span>{" "}
                {isAccepted ? "accepted your request" : "declined your request"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Closes in {timeLeft}s
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Action Button (only for accepted) */}
          {isAccepted && (
            <button
              onClick={handleChatClick}
              className="w-full mt-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Start Chatting 💬
            </button>
          )}
        </div>
      </div>
    </div>
  );
}