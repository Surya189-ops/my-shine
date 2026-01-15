// FILE 4: app/components/PaymentDeclinedToast.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { FiXCircle } from "react-icons/fi";

interface PaymentDeclinedToastProps {
  fromProfileId: string;
  requestId: string;
  onTimeout: () => void;
  onClose: () => void;
}

export default function PaymentDeclinedToast({
  fromProfileId,
  requestId,
  onTimeout,
  onClose,
}: PaymentDeclinedToastProps) {
  const [timeLeft, setTimeLeft] = useState(5);
  const [isVisible, setIsVisible] = useState(true);
  const timeoutCalledRef = useRef(false);

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

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleTimeout = () => {
    if (timeoutCalledRef.current) return;
    timeoutCalledRef.current = true;

    setIsVisible(false);
    setTimeout(() => {
      onTimeout();
      onClose();
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
      <div className="absolute inset-0 bg-red-400 blur-xl opacity-40 rounded-2xl animate-pulse"></div>
      
      {/* Main toast */}
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-red-100">
        {/* Animated progress bar */}
        <div className="h-1.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-red-500 transition-all duration-1000 ease-linear shadow-lg"
            style={{ width: `${(timeLeft / 5) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-4">
            {/* Animated X icon with shake */}
            <div className="relative flex-shrink-0 animate-bounce">
              {/* Pulsing rings */}
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30"></div>
              
              {/* Main icon */}
              <div className="relative w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
                <FiXCircle className="text-white" size={28} strokeWidth={2.5} />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600 mb-0.5">
                Payment Declined 💔
              </p>
              <p className="text-sm text-gray-600 font-medium">
                Connection request was cancelled
              </p>
            </div>

            {/* Sad emoji decoration */}
            <div className="flex-shrink-0 text-2xl opacity-50">
              😔
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-red-400 via-rose-500 to-red-400"></div>
      </div>
    </div>
  );
}