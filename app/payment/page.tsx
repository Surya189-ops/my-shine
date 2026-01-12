// app/payment/page.tsx - Amazon-Style Payment Page with UPI
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaArrowLeft, FaCheckCircle, FaLock, FaCreditCard } from "react-icons/fa";
import { SiPhonepe, SiPaytm, SiGooglepay } from "react-icons/si";
import Image from "next/image";

type Profile = {
  _id: string;
  name: string;
  age: number;
  gender: string;
  tier: "bronze" | "silver" | "gold";
  country: string;
  imageUrl?: string;
};

type Plan = {
  duration: string;
  price: number;
};

const plans: Record<"bronze" | "silver" | "gold", Plan[]> = {
  bronze: [
    { duration: "30 mins", price: 199 },
    { duration: "1 hr", price: 299 },
  ],
  silver: [
    { duration: "30 mins", price: 499 },
    { duration: "1 hr", price: 699 },
  ],
  gold: [
    { duration: "30 mins", price: 1999 },
    { duration: "1 hr", price: 2999 },
  ],
};

type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profileId");
  const requestId = searchParams.get("requestId");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Payment method states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [selectedUPI, setSelectedUPI] = useState<string>("phonepe");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    if (!profileId || !requestId) {
      alert("Invalid payment link");
      router.replace("/");
      return;
    }

    fetchProfile();
  }, [profileId, requestId, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/by-id?profileId=${profileId}`);
      const data = await res.json();

      if (data.success) {
        setProfile(data.profile);
        setSelectedPlan(plans[data.profile.tier as "bronze" | "silver" | "gold"][0]);
      } else {
        alert("Profile not found");
        router.replace("/");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      alert("Failed to load profile");
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan || !profile) return;

    // Validation based on payment method
    if (paymentMethod === "upi" && selectedUPI === "custom" && !upiId.trim()) {
      alert("Please enter your UPI ID");
      return;
    }

    if (paymentMethod === "card") {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCVV.trim() || !cardName.trim()) {
        alert("Please fill all card details");
        return;
      }
    }

    setProcessing(true);

    try {
      // TODO: Integrate actual payment gateway here
      // For now, simulate payment success after 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // After successful payment, redirect to chat
      alert("Payment successful! 🎉");
      router.push(`/chat/${profileId}`);
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please try again.");
      setProcessing(false);
    }
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

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "silver":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "bronze":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - Payment Methods */}
          <div className="lg:col-span-2 space-y-4">
            {/* UPI Payment */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => setPaymentMethod("upi")}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === "upi" ? "border-pink-500" : "border-gray-300"} flex items-center justify-center`}>
                    {paymentMethod === "upi" && (
                      <div className="w-3 h-3 rounded-full bg-pink-500" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">UPI</span>
                </div>
                <span className="text-sm text-gray-500">Recommended</span>
              </button>

              {paymentMethod === "upi" && (
                <div className="border-t p-4 space-y-3">
                  {/* Quick UPI Options */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedUPI("phonepe")}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${selectedUPI === "phonepe" ? "border-pink-500 bg-pink-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <SiPhonepe size={32} className="text-purple-600" />
                      <span className="text-xs font-medium">PhonePe</span>
                    </button>

                    <button
                      onClick={() => setSelectedUPI("googlepay")}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${selectedUPI === "googlepay" ? "border-pink-500 bg-pink-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <SiGooglepay size={32} className="text-blue-600" />
                      <span className="text-xs font-medium">Google Pay</span>
                    </button>

                    <button
                      onClick={() => setSelectedUPI("paytm")}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${selectedUPI === "paytm" ? "border-pink-500 bg-pink-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <SiPaytm size={32} className="text-blue-500" />
                      <span className="text-xs font-medium">Paytm</span>
                    </button>
                  </div>

                  {/* Custom UPI ID */}
                  <button
                    onClick={() => setSelectedUPI("custom")}
                    className={`w-full p-3 border-2 rounded-lg text-left transition-all ${selectedUPI === "custom" ? "border-pink-500 bg-pink-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <span className="text-sm font-medium">Enter UPI ID manually</span>
                  </button>

                  {selectedUPI === "custom" && (
                    <input
                      type="text"
                      placeholder="Enter your UPI ID (e.g., user@paytm)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Credit/Debit Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => setPaymentMethod("card")}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === "card" ? "border-pink-500" : "border-gray-300"} flex items-center justify-center`}>
                    {paymentMethod === "card" && (
                      <div className="w-3 h-3 rounded-full bg-pink-500" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">Credit / Debit Card</span>
                </div>
                <FaCreditCard className="text-gray-400" size={20} />
              </button>

              {paymentMethod === "card" && (
                <div className="border-t p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    maxLength={16}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    placeholder="Cardholder Name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2, 4);
                        }
                        setCardExpiry(value);
                      }}
                      maxLength={5}
                      className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      value={cardCVV}
                      onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      maxLength={3}
                      className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Net Banking */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => setPaymentMethod("netbanking")}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === "netbanking" ? "border-pink-500" : "border-gray-300"} flex items-center justify-center`}>
                    {paymentMethod === "netbanking" && (
                      <div className="w-3 h-3 rounded-full bg-pink-500" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">Net Banking</span>
                </div>
              </button>

              {paymentMethod === "netbanking" && (
                <div className="border-t p-4">
                  <select className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                    <option value="">Select your bank</option>
                    <option value="sbi">State Bank of India</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                    <option value="kotak">Kotak Mahindra Bank</option>
                    <option value="pnb">Punjab National Bank</option>
                  </select>
                </div>
              )}
            </div>

            {/* Wallets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => setPaymentMethod("wallet")}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === "wallet" ? "border-pink-500" : "border-gray-300"} flex items-center justify-center`}>
                    {paymentMethod === "wallet" && (
                      <div className="w-3 h-3 rounded-full bg-pink-500" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">Wallets</span>
                </div>
              </button>

              {paymentMethod === "wallet" && (
                <div className="border-t p-4 grid grid-cols-2 gap-3">
                  <button className="p-3 border-2 border-gray-200 rounded-lg hover:border-pink-500 transition-colors">
                    <span className="text-sm font-medium">Paytm Wallet</span>
                  </button>
                  <button className="p-3 border-2 border-gray-200 rounded-lg hover:border-pink-500 transition-colors">
                    <span className="text-sm font-medium">PhonePe Wallet</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              {/* Profile Info */}
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">BOOKING WITH</h3>
                <div className="flex items-center gap-3">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTierColor(profile.tier)} p-[2px] flex-shrink-0`}>
                    <div
                      className="w-full h-full rounded-full bg-cover bg-center bg-gray-200"
                      style={{
                        backgroundImage: `url(${profile.imageUrl || "/placeholder.jpg"})`,
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{profile.name}</h3>
                    <p className="text-sm text-gray-500">{profile.age} • {profile.gender}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getTierBadgeColor(profile.tier)}`}>
                      {profile.tier.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Selection */}
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">SELECT DURATION</h3>
                <div className="space-y-2">
                  {plans[profile.tier].map((plan) => (
                    <button
                      key={plan.price}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedPlan?.price === plan.price
                          ? "border-pink-500 bg-pink-50"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{plan.duration}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-pink-600">₹{plan.price}</span>
                          {selectedPlan?.price === plan.price && (
                            <FaCheckCircle className="text-pink-500" size={18} />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Details */}
              <div className="p-4 border-b space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">PRICE DETAILS</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Session ({selectedPlan?.duration})</span>
                  <span className="font-medium">₹{selectedPlan?.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Gateway</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-pink-600">₹{selectedPlan?.price}</span>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={processing || !selectedPlan}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-base font-bold py-3 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaLock size={16} />
                      Pay ₹{selectedPlan?.price}
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-500 mt-3 flex items-center justify-center gap-1">
                  <FaLock size={10} />
                  100% Secure Payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}