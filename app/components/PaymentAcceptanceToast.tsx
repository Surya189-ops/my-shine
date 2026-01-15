// FILE 3: app/components/PaymentAcceptanceToast.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface PaymentAcceptanceToastProps {
  fromProfileId: string;
  fromName: string;
  fromImageUrl?: string;
  tier: string;
  requestId: string;
  onTimeout: () => void;
  onClose: () => void;
}

export default function PaymentAcceptanceToast({
  fromProfileId,
  fromName,
  fromImageUrl,
  tier,
  requestId,
  onTimeout,
  onClose,
}: PaymentAcceptanceToastProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(15);
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

  const handlePayNow = () => {
    if (timeoutCalledRef.current) return;
    timeoutCalledRef.current = true;

    setIsVisible(false);
    setTimeout(() => {
      onClose();
      router.push(`/payment?profileId=${fromProfileId}&requestId=${requestId}`);
    }, 300);
  };

  const getTierColors = (tier: string) => {
    switch (tier) {
      case "gold":
        return {
          gradient: "from-yellow-400 via-yellow-500 to-amber-500",
          glow: "bg-yellow-400",
          shimmer: "from-yellow-300 via-amber-400 to-yellow-300"
        };
      case "silver":
        return {
          gradient: "from-gray-300 via-gray-400 to-gray-500",
          glow: "bg-gray-400",
          shimmer: "from-gray-200 via-slate-400 to-gray-200"
        };
      case "bronze":
        return {
          gradient: "from-orange-400 via-amber-600 to-orange-700",
          glow: "bg-orange-400",
          shimmer: "from-orange-300 via-amber-500 to-orange-300"
        };
      default:
        return {
          gradient: "from-gray-400 to-gray-500",
          glow: "bg-gray-400",
          shimmer: "from-gray-300 via-gray-400 to-gray-300"
        };
    }
  };

  const colors = getTierColors(tier);

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md transition-all duration-300 ${
        isVisible 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 -translate-y-4 scale-95"
      }`}
    >
      {/* Outer glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 blur-xl opacity-40 rounded-2xl animate-pulse"></div>
      
      {/* Main toast */}
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Animated progress bar with gradient */}
        <div className="h-1.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 transition-all duration-1000 ease-linear shadow-lg"
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Profile Image with tier ring and shimmer */}
            <div className="relative flex-shrink-0">
              {/* Animated shimmer ring */}
              <div className={`absolute inset-0 bg-gradient-to-r ${colors.shimmer} rounded-full blur-sm animate-pulse opacity-60`}></div>
              
              {/* Tier gradient ring */}
              <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${colors.gradient} p-[3px] shadow-lg`}>
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {fromImageUrl ? (
                      <img
                        src={fromImageUrl}
                        alt={fromName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        👤
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sparkle effect */}
              <div className="absolute -top-1 -right-1 text-lg animate-bounce">
                ✨
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 truncate mb-0.5">
                {fromName} accepted! 🎉
              </p>
              <p className="text-xs text-gray-600 font-medium">
                Complete payment within{" "}
                <span className={`font-bold ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-gray-800"}`}>
                  {timeLeft}s
                </span>
              </p>
            </div>

            {/* Pay Now Button with pulse animation */}
            <button
              onClick={handlePayNow}
              className="relative px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-bold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex-shrink-0 group"
            >
              {/* Button glow on hover */}
              <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
              
              <span className="relative flex items-center gap-1.5">
                💳 Pay Now
              </span>
            </button>
          </div>
        </div>

        {/* Bottom gradient accent with animation */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-pink-300 to-transparent"></div>
      </div>
    </div>
  );
}


