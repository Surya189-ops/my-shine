"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "./components/BottomNav";
import { FiChevronDown, FiChevronRight, FiChevronLeft } from "react-icons/fi";

type Tier = "bronze" | "silver" | "gold";
type Gender = "male" | "female";
type Country =
  | "all"
  | "korea"
  | "japan"
  | "brazil"
  | "france"
  | "spain"
  | "usa"
  | "colombia"
  | "venezuela"
  | "argentina";

type Plan = { duration: string; price: number };

type Profile = {
  _id: string;
  name: string;
  tier: Tier;
  gender: Gender;
  country?: Country;
  imageUrl?: string;
};

const PROFILES_PER_PAGE = 4;

// Helper to check if profile is real (MongoDB ObjectId = 24 hex chars)
const isRealProfile = (profileId: any) => {
  if (!profileId) return false;
  return String(profileId).length === 24;
};

/* -------- COUNTRY RULES (SWITCHED) -------- */
const MEN_COUNTRIES: Country[] = ["usa", "brazil", "colombia", "venezuela", "argentina"];
const WOMEN_COUNTRIES: Country[] = ["korea", "japan", "brazil", "france", "spain"];

/* -------- DEFAULT PROFILES (PER TIER) -------- */
const defaultProfiles: Record<Tier, Profile[]> = {
  bronze: [
    { _id: "b1", name: "Sophia", tier: "bronze", gender: "female", country: "korea" },
    { _id: "b2", name: "Camila", tier: "bronze", gender: "female", country: "japan" },
    { _id: "b3", name: "Ana", tier: "bronze", gender: "female", country: "brazil" },
    { _id: "b4", name: "Maria", tier: "bronze", gender: "female", country: "france" },
    { _id: "b5", name: "Julia", tier: "bronze", gender: "female", country: "spain" },
    { _id: "b6", name: "Gabriela", tier: "bronze", gender: "female", country: "korea" },
    { _id: "b7", name: "Luna", tier: "bronze", gender: "female", country: "japan" },
    { _id: "b8", name: "Valentina", tier: "bronze", gender: "female", country: "brazil" },
    { _id: "b9", name: "Raymond", tier: "bronze", gender: "male", country: "usa" },
    { _id: "b10", name: "Kenji", tier: "bronze", gender: "male", country: "brazil" },
    { _id: "b11", name: "Carlos", tier: "bronze", gender: "male", country: "colombia" },
    { _id: "b12", name: "Lucas", tier: "bronze", gender: "male", country: "venezuela" },
    { _id: "b13", name: "Diego", tier: "bronze", gender: "male", country: "argentina" },
    { _id: "b14", name: "Mateo", tier: "bronze", gender: "male", country: "usa" },
    { _id: "b15", name: "Jae", tier: "bronze", gender: "male", country: "brazil" },
    { _id: "b16", name: "Hiroshi", tier: "bronze", gender: "male", country: "colombia" },
  ],
  silver: [
    { _id: "s1", name: "Valeria", tier: "silver", gender: "female", country: "korea" },
    { _id: "s2", name: "Lucía", tier: "silver", gender: "female", country: "japan" },
    { _id: "s3", name: "Elena", tier: "silver", gender: "female", country: "brazil" },
    { _id: "s4", name: "Sofia", tier: "silver", gender: "female", country: "france" },
    { _id: "s5", name: "Isabella", tier: "silver", gender: "female", country: "spain" },
    { _id: "s6", name: "Natalia", tier: "silver", gender: "female", country: "korea" },
    { _id: "s7", name: "Camila", tier: "silver", gender: "female", country: "japan" },
    { _id: "s8", name: "Andrea", tier: "silver", gender: "female", country: "brazil" },
    { _id: "s9", name: "Min Jae", tier: "silver", gender: "male", country: "usa" },
    { _id: "s10", name: "Pierre", tier: "silver", gender: "male", country: "brazil" },
    { _id: "s11", name: "Hiro", tier: "silver", gender: "male", country: "colombia" },
    { _id: "s12", name: "Rafael", tier: "silver", gender: "male", country: "venezuela" },
    { _id: "s13", name: "Javier", tier: "silver", gender: "male", country: "argentina" },
    { _id: "s14", name: "Jin", tier: "silver", gender: "male", country: "usa" },
    { _id: "s15", name: "Yuto", tier: "silver", gender: "male", country: "brazil" },
    { _id: "s16", name: "Miguel", tier: "silver", gender: "male", country: "colombia" },
  ],
  gold: [
    { _id: "g1", name: "Isabella", tier: "gold", gender: "female", country: "korea" },
    { _id: "g2", name: "Emily", tier: "gold", gender: "female", country: "japan" },
    { _id: "g3", name: "Valentina", tier: "gold", gender: "female", country: "brazil" },
    { _id: "g4", name: "Martina", tier: "gold", gender: "female", country: "france" },
    { _id: "g5", name: "Juliana", tier: "gold", gender: "female", country: "spain" },
    { _id: "g6", name: "Amanda", tier: "gold", gender: "female", country: "korea" },
    { _id: "g7", name: "Carolina", tier: "gold", gender: "female", country: "japan" },
    { _id: "g8", name: "Daniela", tier: "gold", gender: "female", country: "brazil" },
    { _id: "g9", name: "Takashi", tier: "gold", gender: "male", country: "usa" },
    { _id: "g10", name: "Diego", tier: "gold", gender: "male", country: "brazil" },
    { _id: "g11", name: "Seo-jun", tier: "gold", gender: "male", country: "colombia" },
    { _id: "g12", name: "Antoine", tier: "gold", gender: "male", country: "venezuela" },
    { _id: "g13", name: "Yuki", tier: "gold", gender: "male", country: "argentina" },
    { _id: "g14", name: "Gabriel", tier: "gold", gender: "male", country: "usa" },
    { _id: "g15", name: "Mateo", tier: "gold", gender: "male", country: "brazil" },
    { _id: "g16", name: "Tae-hyung", tier: "gold", gender: "male", country: "colombia" },
  ],
};

/* -------- PLANS -------- */
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

/* -------- TIER COLORS -------- */
const tierColors = {
  bronze: {
    active: "bg-gradient-to-br from-orange-400 via-amber-600 to-orange-700",
    inactive: "bg-gray-300",
  },
  silver: {
    active: "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500",
    inactive: "bg-gray-300",
  },
  gold: {
    active: "bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500",
    inactive: "bg-gray-300",
  },
};

export default function HomePage() {
  const router = useRouter();

  const [viewerGender, setViewerGender] = useState<Gender>("male");
  const [selectedTier, setSelectedTier] = useState<Tier>("bronze");
  const [selectedPlan, setSelectedPlan] = useState<Plan>(plans.bronze[0]);
  const [selectedCountry, setSelectedCountry] = useState<Country>("all");
  const [showCountries, setShowCountries] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [requestedProfiles, setRequestedProfiles] = useState<Set<string>>(new Set());

  const oppositeGender: Gender = viewerGender;
  const allowedCountries =
    viewerGender === "female" ? WOMEN_COUNTRIES : MEN_COUNTRIES;

  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) {
      router.replace("/login");
      return;
    }

    fetch(`/api/profiles?gender=${viewerGender}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfiles(data.profiles);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router, oppositeGender]);

  useEffect(() => {
    setSelectedPlan(plans[selectedTier][0]);
    setSelectedCountry("all");
    setCurrentPage(0);
  }, [selectedTier, viewerGender]);

  /* -------- FILTER REAL PROFILES -------- */
  const filtered = profiles.filter((p) => {
    // Basic tier and gender match
    if (p.tier !== selectedTier || p.gender !== viewerGender) return false;

    // If profile has country, check if it's allowed, otherwise include it
    if (p.country && !allowedCountries.includes(p.country as Country)) return false;

    // Country filter
    if (selectedCountry !== "all" && p.country !== selectedCountry) return false;

    return true;
  });

  /* -------- GET ALL AVAILABLE PROFILES (REAL + DEFAULTS) -------- */
  const allAvailableProfiles = (() => {
    const defaults = defaultProfiles[selectedTier].filter(
      (dp) =>
        dp.gender === viewerGender &&
        allowedCountries.includes(dp.country as Country) &&
        (selectedCountry === "all" || dp.country === selectedCountry) &&
        !filtered.some((rp) => rp._id === dp._id)
    );
    return [...filtered, ...defaults];
  })();

  /* -------- PAGINATE: SHOW 4 AT A TIME -------- */
  const startIndex = currentPage * PROFILES_PER_PAGE;
  const endIndex = startIndex + PROFILES_PER_PAGE;
  const displayedProfiles = allAvailableProfiles.slice(startIndex, endIndex);

  /* -------- PAD TO EXACTLY 4 -------- */
  const paddedProfiles = (() => {
    if (displayedProfiles.length >= PROFILES_PER_PAGE) {
      return displayedProfiles.slice(0, PROFILES_PER_PAGE);
    }
    const padding = Array(PROFILES_PER_PAGE - displayedProfiles.length).fill(null);
    return [...displayedProfiles, ...padding];
  })();

  const hasMore = endIndex < allAvailableProfiles.length;
  const hasPrevious = currentPage > 0;

  const loadMore = () => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const loadPrevious = () => {
    if (hasPrevious) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleConnect = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();

    // Don't allow connect for placeholder profiles
    if (!isRealProfile(profileId)) {
      return;
    }

    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) {
      alert("Please login first");
      return;
    }

    const user = JSON.parse(userStr);

    // Check if user has profileId
    if (!user.profileId) {
      alert("Profile not found. Please complete your profile.");
      return;
    }

    try {
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromProfileId: user.profileId,
          toProfileId: profileId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setRequestedProfiles((prev) => new Set(prev).add(profileId));
        console.log("✅ Connection request sent successfully");
      } else {
        alert(data.message || "Request already sent");
      }
    } catch (err) {
      console.error("❌ Connection request error:", err);
      alert("Something went wrong");
    }
  };

  const handleChat = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();

    // Don't allow chat for placeholder profiles
    if (!isRealProfile(profileId)) {
      return;
    }

    router.push(`/chat/${profileId}`);
  };

  const handleProfileClick = (profileId: string) => {
    // Only allow clicking real profiles
    if (!isRealProfile(profileId)) {
      return;
    }
    router.push(`/profile/${profileId}`);
  };

  if (loading)
    return <p className="p-6 text-center text-gray-500">Loading profiles…</p>;

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
          }
          50% {
            box-shadow: 0 0 20px rgba(251, 146, 60, 0.6);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 px-3 pb-20">
        <div className="mx-auto max-w-[560px]">

          {/* TOP SECTION - COMPACT FILTERS */}
          <div className="pt-3 pb-2 space-y-2">

            {/* TIER SELECTOR */}
            <div className="flex justify-center gap-3">
              {(["bronze", "silver", "gold"] as Tier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`w-8 h-8 rounded-full transition-all duration-300
                    ${selectedTier === tier
                      ? `${tierColors[tier].active} shadow-lg scale-110 animate-pulse-glow`
                      : tierColors[tier].inactive
                    }`}
                />
              ))}
            </div>

            {/* PLAN SELECTOR */}
            <div className="flex justify-center gap-2">
              {plans[selectedTier].map((plan) => (
                <button
                  key={plan.price}
                  onClick={() => setSelectedPlan(plan)}
                  className={`px-4 py-1 rounded-full text-xs font-medium transition-all
                    ${selectedPlan.price === plan.price
                      ? "bg-pink-500 text-white shadow"
                      : "bg-gray-200 text-gray-700"
                    }`}
                >
                  ₹{plan.price}
                </button>
              ))}
            </div>

            {/* GENDER + COUNTRY */}
            <div className="flex justify-center items-center gap-2">
              {(["male", "female"] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setViewerGender(g)}
                  className={`px-4 py-1 rounded-full text-xs font-medium transition-all
                    ${viewerGender === g
                      ? "bg-pink-500 text-white shadow"
                      : "bg-white shadow text-gray-700"
                    }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}

              {/* COUNTRY DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setShowCountries((p) => !p)}
                  className="px-3 py-1 rounded-full bg-white shadow text-xs font-medium flex items-center gap-1 text-gray-700"
                >
                  {selectedCountry === "all" ? "Countries" : selectedCountry.charAt(0).toUpperCase() + selectedCountry.slice(1)}
                  <FiChevronDown size={12} />
                </button>

                {showCountries && (
                  <div className="absolute top-9 right-0 w-40 bg-white rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={() => {
                        setSelectedCountry("all");
                        setShowCountries(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-pink-50 ${selectedCountry === "all" ? "bg-pink-50 text-pink-600 font-medium" : ""
                        }`}
                    >
                      All Countries
                    </button>
                    {allowedCountries.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setSelectedCountry(c);
                          setShowCountries(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-pink-50 capitalize ${selectedCountry === c ? "bg-pink-50 text-pink-600 font-medium" : ""
                          }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PROFILE GRID WITH NAVIGATION */}
          <div className="mt-3 flex items-center gap-2">
            {/* LEFT ARROW */}
            <div className="w-8 sm:w-10 flex-shrink-0">
              {hasPrevious && (
                <button
                  onClick={loadPrevious}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-pink-500 text-white shadow-lg flex items-center justify-center hover:bg-pink-600 transition-all hover:scale-110 active:scale-95"
                >
                  <FiChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </button>
              )}
            </div>

            {/* PROFILE GRID */}
            <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-2.5">
              {paddedProfiles.map((profile, idx) => (
                profile ? (
                  <div
                    key={profile._id}
                    onClick={() => handleProfileClick(profile._id)}
                    className={`rounded-lg overflow-hidden bg-white shadow-sm flex flex-col transition-all duration-300 ${isRealProfile(profile._id)
                      ? "hover:-translate-y-2 hover:shadow-xl cursor-pointer"
                      : "opacity-75 cursor-not-allowed"
                      }`}
                    style={{ height: "300px" }}
                  >
                    <div
                      className="bg-gray-200 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${profile.imageUrl || "/placeholder.jpg"})`,
                        height: "220px"
                      }}
                    />

                    <div className="p-2.5 flex flex-col gap-1 flex-1">
                      <p className="text-sm font-semibold text-center truncate">
                        {profile.name}
                      </p>
                      <p className="text-[11px] text-center text-gray-500">
                        {selectedPlan.duration} | ₹{selectedPlan.price}
                      </p>

                      <div className="flex gap-1.5 mt-1">
                        <button
                          onClick={(e) => handleConnect(e, profile._id)}
                          disabled={
                            !isRealProfile(profile._id) ||
                            requestedProfiles.has(profile._id)
                          }
                          className={`flex-1 text-white text-[11px] py-1.5 rounded font-medium
                            ${!isRealProfile(profile._id)
                              ? "bg-gray-300 cursor-not-allowed"
                              : requestedProfiles.has(profile._id)
                                ? "bg-green-500"
                                : "bg-pink-500 hover:bg-pink-600"
                            }`}
                        >
                          {!isRealProfile(profile._id)
                            ? "Unavailable"
                            : requestedProfiles.has(profile._id)
                              ? "Request Sent"
                              : "Connect"}
                        </button>

                        <button
                          onClick={(e) => handleChat(e, profile._id)}
                          disabled={!isRealProfile(profile._id)}
                          className={`flex-1 border text-[11px] py-1.5 rounded font-medium transition-all
                            ${isRealProfile(profile._id)
                              ? "border-pink-500 text-pink-500 hover:bg-pink-50 active:scale-95"
                              : "border-gray-300 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={`empty-${idx}`} className="rounded-lg bg-gray-100" style={{ height: "300px" }} />
                )
              ))}
            </div>

            {/* RIGHT ARROW */}
            <div className="w-8 sm:w-10 flex-shrink-0">
              {hasMore && (
                <button
                  onClick={loadMore}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-pink-500 text-white shadow-lg flex items-center justify-center hover:bg-pink-600 transition-all hover:scale-110 active:scale-95"
                >
                  <FiChevronRight size={18} className="sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      <BottomNav />
    </>
  );
}