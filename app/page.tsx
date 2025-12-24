"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "./components/BottomNav";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type Tier = "bronze" | "silver" | "gold";
type Plan = { duration: string; price: number };

type Profile = {
  _id: string;
  name: string;
  age: number;
  tier: Tier;
  imageUrl?: string;
};

const PROFILES_PER_PAGE = 4;

const tierBadgeStyles: Record<Tier, string> = {
  bronze: "bg-yellow-700 text-white",
  silver: "bg-gray-300 text-gray-800",
  gold: "bg-yellow-400 text-gray-900",
};

const plans: Record<Tier, Plan[]> = {
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

export default function HomePage() {
  const router = useRouter();

  const [selectedTier, setSelectedTier] = useState<Tier>("bronze");
  const [selectedPlan, setSelectedPlan] = useState<Plan>(plans.bronze[0]);
  const [pageIndex, setPageIndex] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(userStr);

    fetch(`/api/profiles?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProfiles(data.profiles);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    setPageIndex(0);
    setSelectedPlan(plans[selectedTier][0]);
  }, [selectedTier]);

  const filteredProfiles = profiles.filter(
    (p) => p.tier === selectedTier
  );

  const currentProfiles = filteredProfiles.slice(
    pageIndex * PROFILES_PER_PAGE,
    pageIndex * PROFILES_PER_PAGE + PROFILES_PER_PAGE
  );

  const totalPages = Math.ceil(
    filteredProfiles.length / PROFILES_PER_PAGE
  );

  if (loading) {
    return <p className="p-4 text-sm">Loading profiles...</p>;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white px-4 pb-28">

        {/* TIER SELECT */}
        <div className="flex justify-center gap-5 pt-6">
          {(["bronze", "silver", "gold"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`w-14 h-14 rounded-full ${
                selectedTier === tier
                  ? "bg-pink-500 scale-105"
                  : "bg-white"
              }`}
            />
          ))}
        </div>

        {/* PLANS */}
        <div className="flex justify-center gap-4 mt-6">
          {plans[selectedTier].map((plan, i) => (
            <button
              key={i}
              onClick={() => setSelectedPlan(plan)}
              className={`w-16 h-16 rounded-full text-xs ${
                selectedPlan.price === plan.price
                  ? "bg-pink-500 text-white"
                  : "bg-white"
              }`}
            >
              {plan.duration}
              <br />₹{plan.price}
            </button>
          ))}
        </div>

        {/* PROFILES GRID */}
        <div className="mt-10 relative">

          {/* LEFT ARROW */}
          <button
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => p - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
          >
            <FiChevronLeft size={22} />
          </button>

          {/* GRID */}
          <div className="grid grid-cols-2 gap-4 px-6">
            {currentProfiles.map((profile) => (
              <div
                key={profile._id}
                className="bg-white rounded-xl shadow overflow-hidden"
                onClick={() => router.push(`/profile/${profile._id}`)}
              >
                <div className="h-32 bg-gray-100">
                  {profile.imageUrl ? (
                    <img
                      src={profile.imageUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-3 text-center">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${tierBadgeStyles[profile.tier]}`}
                  >
                    {profile.tier.toUpperCase()}
                  </span>

                  <p className="text-sm font-medium mt-1">
                    {profile.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    ₹{selectedPlan.price}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT ARROW */}
          <button
            disabled={pageIndex >= totalPages - 1}
            onClick={() => setPageIndex((p) => p + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
          >
            <FiChevronRight size={22} />
          </button>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
