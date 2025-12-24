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

  /* ---------------- AUTH + FETCH PROFILES ---------------- */
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
        if (data.success) {
          setProfiles(data.profiles);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  /* ---------------- RESET ON TIER CHANGE ---------------- */
  useEffect(() => {
    setPageIndex(0);
    setSelectedPlan(plans[selectedTier][0]);
  }, [selectedTier]);

  /* ---------------- FILTER BY TIER ---------------- */
  const filteredProfiles = profiles.filter(
    (profile) => profile.tier === selectedTier
  );

  const currentProfiles = filteredProfiles.slice(
    pageIndex * PROFILES_PER_PAGE,
    pageIndex * PROFILES_PER_PAGE + PROFILES_PER_PAGE
  );

  const totalPages = Math.ceil(
    filteredProfiles.length / PROFILES_PER_PAGE
  );

  /* ---------------- BOOK HANDLER (NEW FLOW) ---------------- */
  const handleBook = (
    profileId: string,
    mode: "call" | "chat"
  ) => {
    router.push(
      `/payment?profileId=${profileId}&tier=${selectedTier}&duration=${selectedPlan.duration === "30 mins" ? 30 : 60
      }&price=${selectedPlan.price}&mode=${mode}`
    );
  };


  if (loading) {
    return <p className="p-4 text-sm">Loading profiles...</p>;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800 px-4 pb-28">

        {/* -------- TIER CIRCLES -------- */}
        <div className="flex justify-center gap-5 pt-6">
          {(["bronze", "silver", "gold"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`
                w-14 h-14 rounded-full transition-all duration-300
                ${selectedTier === tier
                  ? tier === "bronze"
                    ? "bg-gradient-to-br from-yellow-700 to-yellow-500 shadow-lg animate-pulse"
                    : tier === "silver"
                      ? "bg-gradient-to-br from-gray-300 to-gray-100 shadow-lg animate-pulse"
                      : "bg-gradient-to-br from-yellow-400 to-yellow-200 shadow-lg animate-pulse"
                  : "bg-white dark:bg-gray-800 shadow-md hover:scale-105"
                }
              `}
            />
          ))}
        </div>

        {/* -------- PLAN CIRCLES -------- */}
        <div className="flex justify-center gap-4 mt-7">
          {plans[selectedTier].map((plan, index) => {
            const isSelected = selectedPlan.price === plan.price;

            return (
              <button
                key={index}
                onClick={() => setSelectedPlan(plan)}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-200
                  ${isSelected
                    ? "bg-pink-500 shadow-md scale-105"
                    : "bg-white dark:bg-gray-800 shadow-sm hover:scale-105"
                  }`}
              >
                <div
                  className={`text-[11px] font-medium ${isSelected
                      ? "text-black"
                      : "text-gray-700 dark:text-gray-300"
                    }`}
                >
                  {plan.duration}
                </div>
                <div
                  className={`text-[10px] ${isSelected
                      ? "text-black"
                      : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                  ₹{plan.price}
                </div>
              </button>
            );
          })}
        </div>

        {/* -------- PROFILES -------- */}
        <div className="mt-14 flex items-center justify-center gap-4">
          <button
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => p - 1)}
          >
            <FiChevronLeft />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
            {currentProfiles.length === 0 ? (
              <div className="col-span-full text-center text-sm text-gray-500 py-12">
                No profiles available in this tier yet.
              </div>
            ) : (
              currentProfiles.map((profile) => (
                <div
                  key={profile._id}
                  onClick={() => router.push(`/profile/${profile._id}`)}
                  className="w-[260px] bg-white dark:bg-gray-800 shadow cursor-pointer hover:scale-[1.02] transition"
                >
                  {/* IMAGE */}
                  <div className="h-[180px] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {profile.imageUrl ? (
                      <img
                        src={profile.imageUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="py-6 px-4 text-center relative">
                    <span
                      className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full ${tierBadgeStyles[profile.tier]
                        }`}
                    >
                      {profile.tier.toUpperCase()}
                    </span>

                    <h3 className="text-[15px] font-medium text-gray-600 dark:text-gray-300">
                      {profile.name}
                    </h3>

                    <p className="text-xs text-gray-400">
                      {selectedPlan.duration} | ₹{selectedPlan.price}
                    </p>

                    <div className="mt-4 flex gap-2 justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBook(profile._id, "call");
                        }}
                        className="px-4 py-2 bg-pink-500 text-white text-xs rounded"
                      >
                        Connect
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/chat/${profile._id}`);
                        }}
                        className="px-4 py-2 border border-pink-500 text-pink-500 text-xs rounded hover:bg-pink-50"
                      >
                        Chat
                      </button>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          <button
            disabled={pageIndex >= totalPages - 1}
            onClick={() => setPageIndex((p) => p + 1)}
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
