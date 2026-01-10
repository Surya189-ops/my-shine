// app/search/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { FiSearch, FiX } from "react-icons/fi";

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
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [myGender, setMyGender] = useState<Gender | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Profile[]>([]);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
          console.log("👤 Current user gender:", data.profile.gender);
        }
      })
      .catch((err) => console.error("Error fetching user profile:", err));

    // Load recent searches
    const recent = localStorage.getItem("recent_searches");
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent));
      } catch (e) {
        console.error("Failed to parse recent searches");
      }
    }
  }, [router]);

  // Debounced search function
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Show suggestions if input is focused and has text
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    if (!myGender) {
      return;
    }

    // Set new timeout for search (300ms debounce - faster for suggestions)
    searchTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, myGender]);

  const performSearch = async () => {
    if (!myGender) return;

    setLoading(true);
    console.log("🔍 Searching for:", searchQuery);

    try {
      const oppositeGender = myGender === "male" ? "female" : "male";
      
      const res = await fetch(
        `/api/profiles/search?q=${encodeURIComponent(searchQuery)}`
      );
      
      const data = await res.json();

      if (data.success) {
        const allowedCountries = myGender === "male" ? WOMEN_COUNTRIES : MEN_COUNTRIES;
        const filtered = data.profiles.filter((p: Profile) => 
          !p.country || allowedCountries.includes(p.country)
        );
        
        setSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("❌ Search error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const saveToRecentSearches = (profile: Profile) => {
    const updated = [
      profile,
      ...recentSearches.filter((p) => p._id !== profile._id)
    ].slice(0, 5); // Keep last 5 searches
    
    setRecentSearches(updated);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
  };

  const handleProfileClick = (profile: Profile) => {
    if (!isRealProfile(profile._id)) return;
    
    saveToRecentSearches(profile);
    setShowSuggestions(false);
    setSearchQuery("");
    router.push(`/profile/${profile._id}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent_searches");
  };

  const getTierBorderColor = (tier: Tier) => {
    switch (tier) {
      case "gold":
        return "ring-yellow-400";
      case "silver":
        return "ring-gray-400";
      case "bronze":
        return "ring-orange-500";
      default:
        return "ring-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Search */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg">
                <FiSearch className="text-gray-400" size={20} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim() || recentSearches.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Search"
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-500 bg-transparent"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <FiX className="text-gray-500" size={16} />
                  </button>
                )}
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (searchQuery.trim() || recentSearches.length > 0) && (
        <div className="bg-white border-b shadow-lg">
          <div className="max-w-7xl mx-auto">
            {/* Search Results */}
            {searchQuery.trim() && suggestions.length > 0 && (
              <div>
                {suggestions.map((profile) => (
                  <div
                    key={profile._id}
                    onClick={() => handleProfileClick(profile)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {/* Profile Picture with Tier Ring */}
                    <div className={`relative w-11 h-11 rounded-full ring-2 ${getTierBorderColor(profile.tier)} flex-shrink-0`}>
                      {profile.imageUrl ? (
                        <img
                          src={profile.imageUrl}
                          alt={profile.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-xl">
                          {profile.gender === "male" ? "👨" : "👩"}
                        </div>
                      )}
                      
                      {/* Tier Badge */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <div className={`w-3 h-3 rounded-full ${
                          profile.tier === "gold" ? "bg-yellow-400" :
                          profile.tier === "silver" ? "bg-gray-400" :
                          "bg-orange-500"
                        }`} />
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {profile.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {profile.bio || `${profile.age ? `${profile.age} • ` : ""}${profile.country || profile.tier}`}
                      </p>
                    </div>

                    {/* Search Icon */}
                    <FiSearch className="text-gray-400" size={16} />
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {searchQuery.trim() && !loading && suggestions.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">No results found</p>
              </div>
            )}

            {/* Recent Searches */}
            {!searchQuery.trim() && recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <p className="text-sm font-semibold text-gray-900">Recent</p>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-blue-500 font-medium hover:text-blue-600"
                  >
                    Clear all
                  </button>
                </div>
                {recentSearches.map((profile) => (
                  <div
                    key={profile._id}
                    onClick={() => handleProfileClick(profile)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className={`relative w-11 h-11 rounded-full ring-2 ${getTierBorderColor(profile.tier)} flex-shrink-0`}>
                      {profile.imageUrl ? (
                        <img
                          src={profile.imageUrl}
                          alt={profile.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-xl">
                          {profile.gender === "male" ? "👨" : "👩"}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {profile.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {profile.bio || `${profile.age ? `${profile.age} • ` : ""}${profile.country || profile.tier}`}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecentSearches(prev => prev.filter(p => p._id !== profile._id));
                        const updated = recentSearches.filter(p => p._id !== profile._id);
                        localStorage.setItem("recent_searches", JSON.stringify(updated));
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <FiX className="text-gray-400" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!showSuggestions && !searchQuery && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Search
          </h3>
          <p className="text-gray-500 text-sm">
            Search for people by name
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}