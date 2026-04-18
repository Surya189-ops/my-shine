"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaArrowLeft, FaLock, FaCreditCard, FaCheckCircle } from "react-icons/fa";
import { SiPhonepe, SiPaytm, SiGooglepay } from "react-icons/si";
import { useDarkMode } from "@/app/contexts/DarkModeContext";

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

type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

export default function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams?.get("profileId");
  const requestId = searchParams?.get("requestId");
  const { dark } = useDarkMode();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [selectedUPI, setSelectedUPI] = useState<string>("phonepe");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    if (!profileId || !requestId) { alert("Invalid payment link"); router.replace("/"); return; }
    fetchProfile();
  }, [profileId, requestId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/by-id?profileId=${profileId}`);
      const data = await res.json();
      if (data.success) { setProfile(data.profile); }
      else { alert("Profile not found"); router.replace("/"); }
    } catch { alert("Failed to load profile"); router.replace("/"); }
    finally { setLoading(false); }
  };

  const handlePayment = async () => {
    if (!profile) return;
    if (paymentMethod === "upi" && selectedUPI === "custom" && !upiId.trim()) { alert("Please enter your UPI ID"); return; }
    if (paymentMethod === "card" && (!cardNumber.trim() || !cardExpiry.trim() || !cardCVV.trim() || !cardName.trim())) { alert("Please fill all card details"); return; }
    setProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      alert("Payment successful! 🎉");
      router.push(`/chat/${profileId}`);
    } catch { alert("Payment failed. Please try again."); setProcessing(false); }
  };

  const getTierColor = (tier: string) => {
    if (tier === "gold")   return "from-yellow-400 via-yellow-500 to-amber-500";
    if (tier === "silver") return "from-gray-300 via-gray-400 to-gray-500";
    return "from-orange-400 via-amber-600 to-orange-700";
  };

  const getTierBadgeColor = (tier: string) => {
    if (tier === "gold")   return dark ? "bg-yellow-900/40 text-yellow-300 border-yellow-600" : "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (tier === "silver") return dark ? "bg-gray-700 text-gray-300 border-gray-500" : "bg-gray-100 text-gray-800 border-gray-300";
    return dark ? "bg-orange-900/40 text-orange-300 border-orange-600" : "bg-orange-100 text-orange-800 border-orange-300";
  };

  // Dark mode class helpers
  const pageBg    = dark ? "bg-gray-900"  : "bg-gray-50";
  const cardBg    = dark ? "bg-gray-800"  : "bg-white";
  const border    = dark ? "border-gray-700" : "border-gray-200";
  const text      = dark ? "text-gray-100" : "text-gray-900";
  const subtext   = dark ? "text-gray-400" : "text-gray-500";
  const inputCls  = `w-full px-4 py-3 border ${border} rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${dark ? "bg-gray-700 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-400"}`;
  const rowHover  = dark ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const summaryBg = dark ? "bg-gray-700" : "bg-gray-50";

  const radioCircle = (active: boolean) =>
    `w-5 h-5 rounded-full border-2 ${active ? "border-pink-500" : dark ? "border-gray-500" : "border-gray-300"} flex items-center justify-center`;

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
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className={`p-2 ${dark ? "hover:bg-gray-700" : "hover:bg-white"} rounded-full transition-colors`}>
            <FaArrowLeft size={20} className={text} />
          </button>
          <h1 className={`text-2xl font-bold ${text}`}>Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT — Payment Methods */}
          <div className="lg:col-span-2 space-y-4">

            {/* UPI */}
            <div className={`${cardBg} rounded-lg shadow-sm border ${border}`}>
              <button onClick={() => setPaymentMethod("upi")} className={`w-full p-4 flex items-center justify-between ${rowHover} transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={radioCircle(paymentMethod === "upi")}>
                    {paymentMethod === "upi" && <div className="w-3 h-3 rounded-full bg-pink-500" />}
                  </div>
                  <span className={`font-semibold ${text}`}>UPI</span>
                </div>
                <span className={`text-sm ${subtext}`}>Recommended</span>
              </button>

              {paymentMethod === "upi" && (
                <div className={`border-t ${border} p-4 space-y-3`}>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "phonepe",   label: "PhonePe",   icon: <SiPhonepe   size={32} className="text-purple-500" /> },
                      { id: "googlepay", label: "Google Pay", icon: <SiGooglepay size={32} className="text-blue-500" /> },
                      { id: "paytm",     label: "Paytm",      icon: <SiPaytm     size={32} className="text-blue-400" /> },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedUPI(opt.id)}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                          selectedUPI === opt.id
                            ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                            : `${border} ${dark ? "hover:border-gray-500" : "hover:border-gray-300"}`
                        }`}
                      >
                        {opt.icon}
                        <span className={`text-xs font-medium ${text}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedUPI("custom")}
                    className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                      selectedUPI === "custom"
                        ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
                        : `${border} ${dark ? "hover:border-gray-500" : "hover:border-gray-300"}`
                    }`}
                  >
                    <span className={`text-sm font-medium ${text}`}>Enter UPI ID manually</span>
                  </button>
                  {selectedUPI === "custom" && (
                    <input type="text" placeholder="Enter your UPI ID (e.g., user@paytm)" value={upiId} onChange={(e) => setUpiId(e.target.value)} className={inputCls} />
                  )}
                </div>
              )}
            </div>

            {/* Card */}
            <div className={`${cardBg} rounded-lg shadow-sm border ${border}`}>
              <button onClick={() => setPaymentMethod("card")} className={`w-full p-4 flex items-center justify-between ${rowHover} transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={radioCircle(paymentMethod === "card")}>
                    {paymentMethod === "card" && <div className="w-3 h-3 rounded-full bg-pink-500" />}
                  </div>
                  <span className={`font-semibold ${text}`}>Credit / Debit Card</span>
                </div>
                <FaCreditCard className={subtext} size={20} />
              </button>
              {paymentMethod === "card" && (
                <div className={`border-t ${border} p-4 space-y-3`}>
                  <input type="text" placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))} maxLength={16} className={inputCls} />
                  <input type="text" placeholder="Cardholder Name" value={cardName} onChange={(e) => setCardName(e.target.value)} className={inputCls} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="MM/YY" value={cardExpiry}
                      onChange={(e) => { let v = e.target.value.replace(/\D/g, ""); if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2, 4); setCardExpiry(v); }}
                      maxLength={5} className={inputCls} />
                    <input type="password" placeholder="CVV" value={cardCVV} onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, "").slice(0, 3))} maxLength={3} className={inputCls} />
                  </div>
                </div>
              )}
            </div>

            {/* Net Banking */}
            <div className={`${cardBg} rounded-lg shadow-sm border ${border}`}>
              <button onClick={() => setPaymentMethod("netbanking")} className={`w-full p-4 flex items-center justify-between ${rowHover} transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={radioCircle(paymentMethod === "netbanking")}>
                    {paymentMethod === "netbanking" && <div className="w-3 h-3 rounded-full bg-pink-500" />}
                  </div>
                  <span className={`font-semibold ${text}`}>Net Banking</span>
                </div>
              </button>
              {paymentMethod === "netbanking" && (
                <div className={`border-t ${border} p-4`}>
                  <select className={inputCls}>
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
            <div className={`${cardBg} rounded-lg shadow-sm border ${border}`}>
              <button onClick={() => setPaymentMethod("wallet")} className={`w-full p-4 flex items-center justify-between ${rowHover} transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={radioCircle(paymentMethod === "wallet")}>
                    {paymentMethod === "wallet" && <div className="w-3 h-3 rounded-full bg-pink-500" />}
                  </div>
                  <span className={`font-semibold ${text}`}>Wallets</span>
                </div>
              </button>
              {paymentMethod === "wallet" && (
                <div className={`border-t ${border} p-4 grid grid-cols-2 gap-3`}>
                  {["Paytm Wallet", "PhonePe Wallet"].map((w) => (
                    <button key={w} className={`p-3 border-2 ${border} rounded-lg ${dark ? "hover:border-pink-500 text-gray-300" : "hover:border-pink-500 text-gray-700"} transition-colors`}>
                      <span className="text-sm font-medium">{w}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Order Summary */}
          <div className="lg:col-span-1">
            <div className={`${cardBg} rounded-lg shadow-sm border ${border} sticky top-6`}>

              {/* Profile Info */}
              <div className={`p-4 border-b ${border}`}>
                <h3 className={`text-sm font-semibold ${subtext} mb-3`}>BOOKING WITH</h3>
                <div className="flex items-center gap-3">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTierColor(profile.tier)} p-[2px] flex-shrink-0`}>
                    <div className="w-full h-full rounded-full bg-cover bg-center bg-gray-200"
                      style={{ backgroundImage: `url(${profile.imageUrl || "/placeholder.jpg"})` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold ${text} truncate`}>{profile.name}</h3>
                    <p className={`text-sm ${subtext}`}>{profile.age} • {profile.gender}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getTierBadgeColor(profile.tier)}`}>
                      {profile.tier.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fixed Plan */}
              <div className={`p-4 border-b ${border}`}>
                <h3 className={`text-sm font-semibold ${subtext} mb-3`}>SESSION</h3>
                <div className="w-full p-3 rounded-lg border-2 border-pink-500 bg-pink-50 dark:bg-pink-900/20">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${text}`}>{FIXED_PLAN.duration}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-pink-500">₹{FIXED_PLAN.price}</span>
                      <FaCheckCircle className="text-pink-500" size={18} />
                    </div>
                  </div>
                  <p className={`text-xs mt-1 ${subtext}`}>Video call session</p>
                </div>
              </div>

              {/* Price Details */}
              <div className={`p-4 border-b ${border} space-y-2`}>
                <h3 className={`text-sm font-semibold ${subtext} mb-3`}>PRICE DETAILS</h3>
                <div className="flex justify-between text-sm">
                  <span className={subtext}>Session ({FIXED_PLAN.duration})</span>
                  <span className={`font-medium ${text}`}>₹{FIXED_PLAN.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={subtext}>Platform Fee</span>
                  <span className="font-medium text-green-500">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={subtext}>Payment Gateway</span>
                  <span className="font-medium text-green-500">FREE</span>
                </div>
              </div>

              {/* Total + Pay */}
              <div className={`p-4 ${summaryBg} rounded-b-lg`}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-lg font-bold ${text}`}>Total Amount</span>
                  <span className="text-2xl font-bold text-pink-500">₹{FIXED_PLAN.price}</span>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-base font-bold py-3 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Processing...</>
                  ) : (
                    <><FaLock size={16} /> Pay ₹{FIXED_PLAN.price}</>
                  )}
                </button>
                <p className={`text-xs text-center ${subtext} mt-3 flex items-center justify-center gap-1`}>
                  <FaLock size={10} /> 100% Secure Payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}