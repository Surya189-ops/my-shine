"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "./components/BottomNav";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/* ---------------- TYPES ---------------- */
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

/* ---------------- DATA ---------------- */
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

  /* ---------------- AUTH + FETCH ---------------- */
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

  /* ---------------- RESET ON TIER CHANGE ---------------- */
  useEffect(() => {
    setPageIndex(0);
    setSelectedPlan(plans[selectedTier][0]);
  }, [selectedTier]);

  /* ---------------- FILTER + PAGINATION ---------------- */
  const filteredProfiles = profiles.filter(
    (profile) => profile.tier === selectedTier
  );

  const totalPages = Math.ceil(
    filteredProfiles.length / PROFILES_PER_PAGE
  );

  const currentProfiles = filteredProfiles.slice(
    pageIndex * PROFILES_PER_PAGE,
    pageIndex * PROFILES_PER_PAGE + PROFILES_PER_PAGE
  );

  /* ---------------- BOOK ---------------- */
  const handleBook = (profileId: string) => {
    router.push(`/payment?profileId=${profileId}`);
  };

  if (loading) {
    return <p className="p-4 text-sm">Loading profiles...</p>;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white px-4 pb-28">

        {/* -------- TIER SELECT -------- */}
        <div className="flex justify-center gap-5 pt-6">
          {(["bronze", "silver", "gold"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`w-14 h-14 rounded-full transition-all
                ${selectedTier === tier
                  ? "bg-pink-500 shadow-lg scale-105"
                  : "bg-white shadow"
                }`}
            />
          ))}
        </div>

        {/* -------- PLAN SELECT -------- */}
        <div className="flex justify-center gap-4 mt-6">
          {plans[selectedTier].map((plan) => {
            const active = selectedPlan.price === plan.price;
            return (
              <button
                key={plan.price}
                onClick={() => setSelectedPlan(plan)}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center
                  ${active ? "bg-pink-500 text-white" : "bg-white shadow"}
                `}
              >
                <span className="text-[11px]">{plan.duration}</span>
                <span className="text-[10px]">₹{plan.price}</span>
              </button>
            );
          })}
        </div>

        {/* -------- PROFILES GRID (2×2 MOBILE) -------- */}
        <div className="mt-10">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            {currentProfiles.length === 0 ? (
              <div className="col-span-2 text-center text-sm text-gray-500 py-12">
                No profiles available.
              </div>
            ) : (
              currentProfiles.map((profile) => (
                <div
                  key={profile._id}
                  onClick={() => router.push(`/profile/${profile._id}`)}
                  className="bg-white shadow rounded-lg overflow-hidden cursor-pointer"
                >
                  {/* IMAGE */}
                  <div className="h-[150px] bg-gray-100">
                    {profile.imageUrl ? (
                      <img
                        src={profile.imageUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="p-3 text-center relative">
                    <span
                      className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full ${tierBadgeStyles[profile.tier]}`}
                    >
                      {profile.tier.toUpperCase()}
                    </span>

                    <h3 className="text-sm font-medium">
                      {profile.name}
                    </h3>

                    <p className="text-[11px] text-gray-400">
                      {selectedPlan.duration} • ₹{selectedPlan.price}
                    </p>

                    <div className="mt-3 flex gap-2 justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBook(profile._id);
                        }}
                        className="px-3 py-1.5 bg-pink-500 text-white text-xs rounded"
                      >
                        Book
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/chat/${profile._id}`);
                        }}
                        className="px-3 py-1.5 border border-pink-500 text-pink-500 text-xs rounded"
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* -------- PAGINATION -------- */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-6 mt-6">
              <button
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((p) => p - 1)}
                className="p-2 rounded-full bg-white shadow disabled:opacity-40"
              >
                <FiChevronLeft />
              </button>

              <button
                disabled={pageIndex >= totalPages - 1}
                onClick={() => setPageIndex((p) => p + 1)}
                className="p-2 rounded-full bg-white shadow disabled:opacity-40"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
