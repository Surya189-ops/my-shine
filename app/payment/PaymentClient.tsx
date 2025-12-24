"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FiClock, FiCheck } from "react-icons/fi";

type Tier = "Bronze" | "Silver" | "Gold";

type Profile = {
  name: string;
  imageUrl?: string;
  tier?: string;
};

const TIER_PRICING: Record<Tier, { duration: number; price: number }[]> = {
  Bronze: [
    { duration: 30, price: 149 },
    { duration: 60, price: 249 },
  ],
  Silver: [
    { duration: 30, price: 199 },
    { duration: 60, price: 349 },
  ],
  Gold: [
    { duration: 30, price: 299 },
    { duration: 60, price: 499 },
  ],
};

const normalizeTier = (tier?: string): Tier => {
  if (!tier) return "Silver";
  const t = tier.toLowerCase();
  if (t === "bronze") return "Bronze";
  if (t === "gold") return "Gold";
  return "Silver";
};

const getPlansForTier = (tier?: string) =>
  TIER_PRICING[normalizeTier(tier)];

export default function PaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profileId");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{
    duration: number;
    price: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (!profileId) return;

    fetch(`/api/profile/by-id?profileId=${profileId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.profile) return;
        setProfile(data.profile);

        const plans = getPlansForTier(data.profile.tier);
        if (plans.length > 0) setSelectedPlan(plans[0]);
      });
  }, [profileId]);

  const handlePay = async () => {
    if (!profileId || !selectedPlan || !profile) return;

    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) return;

    const user = JSON.parse(userStr);
    setLoading(true);

    const res = await fetch("/api/bookings/extend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        profileId,
        tier: normalizeTier(profile.tier),
        duration: selectedPlan.duration,
        price: selectedPlan.price,
      }),
    });

    setLoading(false);
    const data = await res.json();
    if (data.success) router.replace(`/chat/${profileId}`);
  };

  if (!profile || !selectedPlan) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto px-4 pt-4 pb-28">
        <h1 className="text-lg font-semibold mb-4">
          Confirm your booking
        </h1>

        <div className="bg-white rounded-xl p-3 shadow flex items-center gap-3 mb-4">
          {profile.imageUrl ? (
            <img src={profile.imageUrl} className="w-12 h-12 rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300" />
          )}
          <div>
            <p className="font-medium">{profile.name}</p>
            <p className="text-xs text-gray-500">
              {normalizeTier(profile.tier)} profile
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow mb-4">
          {getPlansForTier(profile.tier).map((plan) => (
            <button
              key={plan.duration}
              onClick={() => setSelectedPlan(plan)}
              className={`w-full flex justify-between px-4 py-3 ${
                selectedPlan.duration === plan.duration
                  ? "bg-pink-50"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                <FiClock /> {plan.duration} mins
              </div>
              <div className="flex items-center gap-2">
                ₹{plan.price}
                {selectedPlan.duration === plan.duration && (
                  <FiCheck className="text-pink-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-pink-500 text-white py-3 rounded-full font-semibold"
          >
            {loading ? "Processing..." : `Pay ₹${selectedPlan.price}`}
          </button>
        </div>
      </div>
    </div>
  );
}
