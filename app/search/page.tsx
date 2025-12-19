"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

type Tier = "bronze" | "silver" | "gold";

type Profile = {
  id: number;
  name: string;
  age: number;
  tier: Tier;
};

const profiles: Profile[] = [
  { id: 1, name: "Sam Oppa Tour", age: 32, tier: "gold" },
  { id: 2, name: "Raymond Oppa Tour", age: 30, tier: "silver" },
  { id: 3, name: "Jay Oppa Tour", age: 28, tier: "bronze" },
  { id: 4, name: "Jake Oppa Tour", age: 29, tier: "bronze" },
  { id: 5, name: "Ken Oppa Tour", age: 31, tier: "silver" },
  { id: 6, name: "Ryan Oppa Tour", age: 33, tier: "gold" },
];

export default function SearchPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Tier>("all");

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

  const filteredProfiles = profiles.filter((p) => {
    const matchesName = p.name
      .toLowerCase()
      .includes(query.toLowerCase());

    const matchesTier = filter === "all" || p.tier === filter;

    return matchesName && matchesTier;
  });

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800 px-4 pb-28">

        {/* SEARCH BAR */}
        <div className="pt-6 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full px-4 py-3 rounded-full
              border border-gray-300 dark:border-gray-700
              bg-white dark:bg-gray-800
              text-gray-800 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-pink-400
              transition
            "
          />
        </div>

        {/* FILTER CHIPS */}
        <div className="flex justify-center gap-3 mt-6">
          {["all", "bronze", "silver", "gold"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as "all" | Tier)}
              className={`
                px-4 py-1.5 rounded-full text-sm capitalize transition
                ${
                  filter === t
                    ? "bg-pink-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border"
                }
              `}
            >
              {t}
            </button>
          ))}
        </div>

        {/* RESULTS */}
        <div className="mt-10 flex justify-center">
          {filteredProfiles.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No profiles found
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="
                    w-[260px]
                    bg-white dark:bg-gray-800
                    border border-gray-200 dark:border-gray-700
                    shadow-sm
                    transition-all duration-300
                    hover:-translate-y-2 hover:shadow-lg
                  "
                >
                  {/* IMAGE */}
                  <div className="h-[180px] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    Image
                  </div>

                  {/* CONTENT */}
                  <div className="py-6 px-4 text-center">
                    <h3 className="text-[15px] font-medium text-gray-600 dark:text-gray-300">
                      {profile.name}, {profile.age}
                    </h3>

                    <p className="text-xs text-gray-400 mt-1 capitalize">
                      {profile.tier} tier
                    </p>

                    <button
                      className="
                        mt-4
                        px-6 py-2
                        bg-pink-500 text-white
                        text-xs font-medium
                        rounded
                        hover:bg-pink-600
                        transition
                      "
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
