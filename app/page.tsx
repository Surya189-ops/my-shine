"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "./components/BottomNav";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/* ---------------- TYPES ---------------- */
type Tier = "bronze" | "silver" | "gold";
type Plan = { duration: string; price: number };
type Profile = { id: number; name: string; age: number };

const PROFILES_PER_PAGE = 4;

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

const profilesByTier: Record<Tier, Profile[]> = {
  bronze: [
    { id: 1, name: "Sam Oppa Tour", age: 32 },
    { id: 2, name: "Raymond Oppa Tour", age: 30 },
    { id: 3, name: "Jay Oppa Tour", age: 28 },
    { id: 4, name: "Jake Oppa Tour", age: 29 },
    { id: 5, name: "Ken Oppa Tour", age: 31 },
    { id: 6, name: "Ryan Oppa Tour", age: 33 },
  ],
  silver: [
    { id: 7, name: "Daniel Oppa Tour", age: 34 },
    { id: 8, name: "Chris Oppa Tour", age: 35 },
  ],
  gold: [
    { id: 9, name: "Elite Oppa Tour", age: 38 },
  ],
};

export default function HomePage() {
  const router = useRouter();

  const [selectedTier, setSelectedTier] = useState<Tier>("bronze");
  const [selectedPlan, setSelectedPlan] = useState<Plan>(plans.bronze[0]);
  const [pageIndex, setPageIndex] = useState(0);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    const user = localStorage.getItem("myshine_user");
    if (!user) {
      router.replace("/login");
      return;
    }

    try {
      const parsed = JSON.parse(user);
      if (!parsed.loggedIn) {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  /* ---------------- RESET PLAN ON TIER CHANGE ---------------- */
  useEffect(() => {
    setPageIndex(0);
    setSelectedPlan(plans[selectedTier][0]);
  }, [selectedTier]);

  const currentProfiles = profilesByTier[selectedTier].slice(
    pageIndex * PROFILES_PER_PAGE,
    pageIndex * PROFILES_PER_PAGE + PROFILES_PER_PAGE
  );

  const totalPages = Math.ceil(
    profilesByTier[selectedTier].length / PROFILES_PER_PAGE
  );

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
                ${
                  selectedTier === tier
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
          {plans[selectedTier].map((plan, index) => (
            <button
              key={index}
              onClick={() => setSelectedPlan(plan)}
              className={`w-16 h-16 rounded-full
                flex flex-col items-center justify-center transition-all
                ${
                  selectedPlan.price === plan.price
                    ? "bg-pink-500 text-white shadow-md scale-105"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm hover:scale-105"
                }
              `}
            >
              <div className="text-[11px] font-medium leading-tight">
                {plan.duration}
              </div>
              <div className="text-[10px] mt-0.5 leading-tight">
                ₹{plan.price}
              </div>
            </button>
          ))}
        </div>

        {/* -------- PROFILES -------- */}
        <div className="mt-14 flex items-center justify-center gap-4">

          {/* LEFT ARROW */}
          <button
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => p - 1)}
            className={`p-2 rounded-full transition
              ${
                pageIndex === 0
                  ? "opacity-30"
                  : "bg-white dark:bg-gray-800 shadow hover:scale-110"
              }
            `}
          >
            <FiChevronLeft size={20} />
          </button>

          {/* CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
            {currentProfiles.map((profile) => (
              <div
                key={profile.id}
                className="
                  w-[260px]
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  shadow-sm
                  transition-all duration-300 ease-out
                  hover:-translate-y-2 hover:shadow-lg
                "
              >
                <div className="h-[180px] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  Image
                </div>

                <div className="py-6 px-4 text-center">
                  <h3 className="text-[15px] font-medium text-gray-600 dark:text-gray-300">
                    {profile.name}
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    {selectedPlan.duration} &nbsp;|&nbsp; ₹{selectedPlan.price}
                  </p>

                  <button
                    className="
                      mt-4 px-6 py-2
                      bg-pink-500 text-white
                      text-xs font-medium
                      rounded
                      hover:bg-pink-600
                      transition
                    "
                  >
                    Book It
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT ARROW */}
          <button
            disabled={pageIndex >= totalPages - 1}
            onClick={() => setPageIndex((p) => p + 1)}
            className={`p-2 rounded-full transition
              ${
                pageIndex >= totalPages - 1
                  ? "opacity-30"
                  : "bg-white dark:bg-gray-800 shadow hover:scale-110"
              }
            `}
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
