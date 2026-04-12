"use client";

import { useState } from "react";
import { FiX, FiLock, FiClock } from "react-icons/fi";

type Props = {
  otherName: string;
  otherImageUrl?: string;
  type: "initial" | "extend";
  onPay: () => void;
  onCancel: () => void;
};

export default function VideoCallPaymentModal({
  otherName,
  otherImageUrl,
  type,
  onPay,
  onCancel,
}: Props) {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"phonepe" | "googlepay" | "paytm" | "custom">("phonepe");
  const [upiId, setUpiId] = useState("");

  const price = type === "initial" ? 199 : 99;
  const duration = type === "initial" ? "10 minutes" : "5 minutes";
  const title = type === "initial" ? "Start Video Call" : "+5 Minutes Extension";

  const handlePay = async () => {
    if (paymentMethod === "custom" && !upiId.trim()) {
      alert("Please enter your UPI ID");
      return;
    }
    setProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setProcessing(false);
    onPay();
  };

  const upiOptions = [
    { id: "phonepe", label: "PhonePe", emoji: "💜" },
    { id: "googlepay", label: "GPay", emoji: "🔵" },
    { id: "paytm", label: "Paytm", emoji: "💙" },
    { id: "custom", label: "Other UPI", emoji: "📱" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">{title}</h2>
            <p className="text-pink-100 text-xs mt-0.5">with {otherName}</p>
          </div>
          <button onClick={onCancel} className="text-white/70 hover:text-white">
            <FiX size={22} />
          </button>
        </div>

        {/* PROFILE + PRICE */}
        <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-100">
          {otherImageUrl ? (
            <img src={otherImageUrl} className="w-14 h-14 rounded-full object-cover" alt={otherName} />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
              {otherName[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-gray-800">{otherName}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <FiClock size={13} className="text-pink-500" />
              <span className="text-sm text-gray-500">{duration} video call</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-pink-600">₹{price}</p>
            <p className="text-xs text-gray-400">{duration}</p>
          </div>
        </div>

        {/* PAYMENT METHOD */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pay via UPI</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {upiOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPaymentMethod(opt.id as any)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  paymentMethod === opt.id
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {paymentMethod === "custom" && (
            <input
              type="text"
              placeholder="Enter UPI ID (e.g. user@paytm)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 mb-3"
            />
          )}

          {/* PAY BUTTON */}
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FiLock size={16} />
                Pay ₹{price}
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
            <FiLock size={10} />
            100% Secure Payment
          </p>
        </div>
      </div>
    </div>
  );
}