// app/components/PaymentToast.tsx - Payment notification when connection is accepted
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PaymentToastData {
  fromProfile: {
    _id: string;
    name: string;
    imageUrl?: string;
  };
}

interface PaymentToastProps {
  data: PaymentToastData | null;
  onClose: () => void;
}

export default function PaymentToast({ data, onClose }: PaymentToastProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(12);

  useEffect(() => {
    if (data) {
      setIsVisible(true);
      setCountdown(12);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [data]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handlePay = () => {
    // TODO: Integrate payment gateway
    alert("Payment feature coming soon!");
    handleClose();
  };

  const handleChat = () => {
    if (data) {
      handleClose();
      router.push(`/chat/${data.fromProfile._id}`);
    }
  };

  if (!data) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
      style={{ maxWidth: "90%", width: "400px" }}
    >
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Connection Accepted! 🎉</h3>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
            {data.fromProfile.imageUrl ? (
              <img
                src={data.fromProfile.imageUrl}
                alt={data.fromProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                👤
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {data.fromProfile.name} accepted your request!
            </p>
            <p className="text-xs text-white/80">
              Pay to start chatting
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="mb-3 text-center">
          <p className="text-xs text-white/80">
            This notification will close in {countdown}s
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePay}
            className="flex-1 bg-white text-purple-600 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
          >
            💳 Pay Now
          </button>
          <button
            onClick={handleChat}
            className="flex-1 bg-white/20 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors border border-white/30"
          >
            💬 Chat Free
          </button>
        </div>
      </div>
    </div>
  );
}