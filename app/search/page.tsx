// app/search/page.tsx - Dedicated Profile Search Page
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { FiSearch } from "react-icons/fi";

type Tier = "bronze" | "silver" | "gold";
type Gender = "male" | "female";
type Country =
  | "korea"
  | "japan"
  | "brazil"
  | "france"
  | "spain"
  | "usa"
  | "colombia"
  | "venezuela"
  | "argentina";

type Profile = {
  _id: string;
  name: string;
  age?: number;
  tier: Tier;
  gender: Gender;
  country?: Country;
  imageUrl?: string;
  bio?: string;
};

// Helper to check if profile is real
const isRealProfile = (profileId: any) => {
  if (!profileId) return false;
  return String(profileId).length === 24;
};

const MEN_COUNTRIES: Country[] = ["usa", "brazil", "colombia", "venezuela", "argentina"];
const WOMEN_COUNTRIES: Country[] = ["korea", "japan", "brazil", "france", "spain"];

export default function SearchPage() {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [myGender, setMyGender] = useState<Gender | null>(null);
  const [requestedProfiles, setRequestedProfiles] = useState<Set<string>>(new Set());

  // Get current user's gender
  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(userStr);
    if (!user.profileId) {
      router.replace("/profile");
      return;
    }

    // Fetch current user's profile to get gender
    fetch(`/api/profile/by-id?profileId=${user.profileId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMyGender(data.profile.gender);
        }
      })
      .catch((err) => console.error("Error fetching user profile:", err));
  }, [router]);

  // Fetch all profiles when user's gender is known
  useEffect(() => {
    if (!myGender) return;

    setLoading(true);
    // Fetch opposite gender profiles
    const oppositeGender = myGender === "male" ? "female" : "male";
    
    fetch(`/api/profiles?gender=${oppositeGender}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Filter by allowed countries
          const allowedCountries = myGender === "male" ? WOMEN_COUNTRIES : MEN_COUNTRIES;
          const filtered = data.profiles.filter((p: Profile) => 
            !p.country || allowedCountries.includes(p.country)
          );
          setAllProfiles(filtered);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching profiles:", err);
        setLoading(false);
      });
  }, [myGender]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProfiles([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = allProfiles.filter((profile) =>
      profile.name.toLowerCase().includes(query)
    );
    setFilteredProfiles(results);
  }, [searchQuery, allProfiles]);

  const handleConnect = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();

    if (!isRealProfile(profileId)) {
      return;
    }

    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) {
      alert("Please login first");
      return;
    }

    const user = JSON.parse(userStr);

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

  const handleProfileClick = (profileId: string) => {
    if (!isRealProfile(profileId)) {
      return;
    }
    router.push(`/profile/${profileId}`);
  };

  const getTierColor = (tier: Tier) => {
    switch (tier) {
      case "gold":
        return "bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500";
      case "silver":
        return "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500";
      case "bronze":
        return "bg-gradient-to-br from-orange-400 via-amber-600 to-orange-700";
      default:
        return "bg-gray-400";
    }
  };

  const getTierBadgeColor = (tier: Tier) => {
    switch (tier) {
      case "gold":
        return "text-yellow-600";
      case "silver":
        return "text-gray-500";
      case "bronze":
        return "text-orange-600";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800 mb-3">
            🔍 Search Profiles
          </h1>

          {/* Search Bar */}
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-full border border-gray-200">
              <FiSearch className="text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Initial State - No Search */}
        {!searchQuery && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Search for Profiles
            </h3>
            <p className="text-gray-500 text-sm">
              Type a name to find people
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && searchQuery && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-3 text-gray-500 text-sm">Searching...</p>
          </div>
        )}

        {/* Results Count */}
        {searchQuery && !loading && (
          <p className="text-xs text-gray-500 mb-3">
            Found {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? "s" : ""} matching "{searchQuery}"
          </p>
        )}

        {/* No Results */}
        {searchQuery && !loading && filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No profiles found
            </h3>
            <p className="text-gray-500 text-sm">
              No profiles match "{searchQuery}"
            </p>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && !loading && filteredProfiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProfiles.map((profile) => (
              <div
                key={profile._id}
                onClick={() => handleProfileClick(profile._id)}
                className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all"
              >
                {/* Profile Image */}
                <div className="relative h-56 bg-gray-200">
                  {profile.imageUrl ? (
                    <img
                      src={profile.imageUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {profile.gender === "male" ? "👨" : "👩"}
                    </div>
                  )}

                  {/* Tier Badge */}
                  <div
                    className={`absolute top-3 right-3 ${getTierColor(profile.tier)} text-white px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg`}
                  >
                    {profile.tier}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800 truncate">
                      {profile.name}
                    </h3>
                    {profile.age && (
                      <span className="text-gray-600 text-sm">{profile.age}</span>
                    )}
                  </div>

                  {profile.country && (
                    <p className="text-xs text-gray-500 mb-2 capitalize">
                      📍 {profile.country}
                    </p>
                  )}

                  {profile.bio && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  <button
                    onClick={(e) => handleConnect(e, profile._id)}
                    disabled={
                      !isRealProfile(profile._id) ||
                      requestedProfiles.has(profile._id)
                    }
                    className={`w-full text-white text-sm py-2.5 rounded-full font-medium transition-all
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
                        ? "✓ Request Sent"
                        : "Connect"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}