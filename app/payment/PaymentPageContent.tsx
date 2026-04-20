"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaArrowLeft, FaLock, FaCheckCircle } from "react-icons/fa";
import { useDarkMode } from "@/app/contexts/DarkModeContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Profile = {
  _id: string;
  name: string;
  age: number;
  gender: string;
  tier: "bronze" | "silver" | "gold";
  country: string;
  imageUrl?: string;
};

const FIXED_PLAN = { duration: "10 mins", price: 199 };

export default function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams?.get("profileId");
  const requestId = searchParams?.get("requestId");
  const { dark } = useDarkMode();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const pageBg   = dark ? "bg-gray-900"     : "bg-gray-50";
  const cardBg   = dark ? "bg-gray-800"     : "bg-white";
  const border   = dark ? "border-gray-700" : "border-gray-200";
  const text     = dark ? "text-gray-100"   : "text-gray-900";
  const subtext  = dark ? "text-gray-400"   : "text-gray-500";
  const summaryBg = dark ? "bg-gray-700"    : "bg-gray-50";

  /* -------- Load Razorpay script -------- */
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    if (!profileId || !requestId) {
      alert("Invalid payment link");
      router.replace("/");
      return;
    }
    fetchProfile();
  }, [profileId, requestId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/by-id?profileId=${profileId}`);
      const data = await res.json();
      if (data.success) setProfile(data.profile);
      else { alert("Profile not found"); router.replace("/"); }
    } catch {
      alert("Failed to load profile");
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!profile) return;
    setProcessing(true);

    try {
      /* Step 1 — Create Razorpay order */
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: FIXED_PLAN.price, profileId }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        alert("Failed to initiate payment. Try again.");
        setProcessing(false);
        return;
      }

      /* Step 2 — Open Razorpay checkout */
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: "INR",
        name: "My Shine",
        description: `Video call with ${profile.name} - ${FIXED_PLAN.duration}`,
        image: "/icon-192.png",
        order_id: orderData.order.id,
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: { color: "#ec4899" },
        handler: async (response: any) => {
          /* Step 3 — Verify payment */
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            alert("Payment successful! 🎉 Starting your video call.");
            router.push(`/chat/${profileId}`);
          } else {
            alert("Payment verification failed. Contact support.");
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        alert(`Payment failed: ${response.error.description}`);
        setProcessing(false);
      });
      rzp.open();

    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className={`min-h-screen ${pageBg} flex items-center justify-center`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto mb-4" />
        <p className={subtext}>Loading payment details...</p>
      </div>
    </div>
  );

  if (!profile) return null;

  return (
    <div className={`min-h-screen ${pageBg} transition-colors duration-300`}>
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className={`p-2 ${dark ? "hover:bg-gray-700" : "hover:bg-white"} rounded-full transition-colors`}>
            <FaArrowLeft size={20} className={text} />
          </button>
          <h1 className={`text-2xl font-bold ${text}`}>Checkout</h1>
        </div>

        {/* Profile Card */}
        <div className={`${cardBg} rounded-2xl shadow-sm border ${border} p-4 mb-4 flex items-center gap-4`}>
          <div className="w-16 h-16 rounded-full bg-cover bg-center bg-gray-200 flex-shrink-0"
            style={{ backgroundImage: `url(${profile.imageUrl || "/placeholder.jpg"})` }} />
          <div>
            <h3 className={`font-bold text-lg ${text}`}>{profile.name}</h3>
            <p className={`text-sm ${subtext} capitalize`}>{profile.country} • {profile.gender}</p>
          </div>
        </div>

        {/* Session Info */}
        <div className={`${cardBg} rounded-2xl shadow-sm border ${border} p-4 mb-4`}>
          <h3 className={`text-xs font-semibold ${subtext} uppercase tracking-wide mb-3`}>Session Details</h3>
          <div className="flex items-center justify-between bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-300 rounded-xl p-4">
            <div>
              <p className={`font-semibold ${text}`}>{FIXED_PLAN.duration} Video Call</p>
              <p className={`text-xs ${subtext} mt-0.5`}>One-on-one private session</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-pink-500">₹{FIXED_PLAN.price}</span>
              <FaCheckCircle className="text-pink-500" size={18} />
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className={`${cardBg} rounded-2xl shadow-sm border ${border} p-4 mb-6`}>
          <h3 className={`text-xs font-semibold ${subtext} uppercase tracking-wide mb-3`}>Price Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={subtext}>Session ({FIXED_PLAN.duration})</span>
              <span className={`font-medium ${text}`}>₹{FIXED_PLAN.price}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={subtext}>Platform Fee</span>
              <span className="font-medium text-green-500">FREE</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={subtext}>GST</span>
              <span className="font-medium text-green-500">Included</span>
            </div>
            <div className={`border-t ${border} pt-2 flex justify-between`}>
              <span className={`font-bold ${text}`}>Total</span>
              <span className="font-bold text-pink-500 text-lg">₹{FIXED_PLAN.price}</span>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-base font-bold py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Opening Payment...
            </>
          ) : (
            <>
              <FaLock size={16} />
              Pay ₹{FIXED_PLAN.price} with Razorpay
            </>
          )}
        </button>

        <p className={`text-xs text-center ${subtext} mt-3 flex items-center justify-center gap-1`}>
          <FaLock size={10} /> 100% Secure • Powered by Razorpay
        </p>

        {/* Razorpay Badge */}
        <div className="flex items-center justify-center mt-4 gap-2">
          <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-5 opacity-60" />
          <span className={`text-xs ${subtext}`}>Secured by Razorpay</span>
        </div>
      </div>
    </div>
  );
}