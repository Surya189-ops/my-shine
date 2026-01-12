// app/components/PaymentAcceptanceToast.tsx - FIXED
"use client";

import { useEffect, useState, useRef } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
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
  const timeoutCalledRef = useRef(false); // ✅ Prevent double call

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
  }, []); // ✅ Empty dependency array - only run once

  const handleTimeout = () => {
    if (timeoutCalledRef.current) {
      console.log("⚠️ Timeout already called, skipping...");
      return;
    }

    timeoutCalledRef.current = true;
    console.log("⏰ Payment toast timeout - calling onTimeout once");

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
      // Redirect to payment page with all necessary data
      router.push(`/payment?profileId=${fromProfileId}&requestId=${requestId}`);
    }, 300);
  };

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
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-green-200">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Profile Image with Tier Border */}
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${getTierColor(
                  tier
                )} p-[3px]`}
              >
                <div
                  className="w-full h-full rounded-full bg-cover bg-center bg-gray-200"
                  style={{
                    backgroundImage: `url(${fromImageUrl || "/placeholder.jpg"})`,
                  }}
                />
              </div>
              {/* Green checkmark indicator */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-600 truncate">
                {fromName} accepted! 🎉
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Complete payment to start chatting
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Expires in {timeLeft}s
              </p>
            </div>

            {/* Pay Now Button */}
            <button
              onClick={handlePayNow}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold rounded-full flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <FaMoneyBillWave size={14} />
              Pay Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}