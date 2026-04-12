"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { FiSearch, FiX } from "react-icons/fi";

type Tier = "bronze" | "silver" | "gold";
type Gender = "male" | "female";
type Country = "korea" | "japan" | "brazil" | "france" | "spain" | "usa" | "colombia" | "venezuela" | "argentina";

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

  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) { router.replace("/login"); return; }
    const user = JSON.parse(userStr);
    if (!user.profileId) { router.replace("/profile"); return; }

    fetch(`/api/profile/by-id?profileId=${user.profileId}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setMyGender(data.profile.gender); })
      .catch(console.error);

    const recent = localStorage.getItem("recent_searches");
    if (recent) { try { setRecentSearches(JSON.parse(recent)); } catch (e) {} }
  }, [router]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim() || !myGender) { setSuggestions([]); return; }
    searchTimeoutRef.current = setTimeout(performSearch, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, myGender]);

  const performSearch = async () => {
    if (!myGender) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        const allowedCountries = myGender === "male" ? WOMEN_COUNTRIES : MEN_COUNTRIES;
        const filtered = data.profiles.filter((p: Profile) => !p.country || allowedCountries.includes(p.country));
        setSuggestions(filtered.slice(0, 10));
        setShowSuggestions(true);
      } else setSuggestions([]);
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  const saveToRecentSearches = (profile: Profile) => {
    const updated = [profile, ...recentSearches.filter((p) => p._id !== profile._id)].slice(0, 5);
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

  const getTierBorderColor = (tier: Tier) => {
    switch (tier) {
      case "gold": return "ring-yellow-400";
      case "silver": return "ring-gray-400";
      case "bronze": return "ring-orange-500";
      default: return "ring-gray-300";
    }
  };

  const ProfileItem = ({ profile, showRemove = false }: { profile: Profile; showRemove?: boolean }) => (
    <div
      onClick={() => handleProfileClick(profile)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
    >
      <div className={`relative w-11 h-11 rounded-full ring-2 ${getTierBorderColor(profile.tier)} flex-shrink-0`}>
        {profile.imageUrl ? (
          <img src={profile.imageUrl} alt={profile.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xl">
            {profile.gender === "male" ? "👨" : "👩"}
          </div>
        )}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
          <div className={`w-3 h-3 rounded-full ${profile.tier === "gold" ? "bg-yellow-400" : profile.tier === "silver" ? "bg-gray-400" : "bg-orange-500"}`} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{profile.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {profile.bio || `${profile.age ? `${profile.age} • ` : ""}${profile.country || profile.tier}`}
        </p>
      </div>
      {showRemove ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const updated = recentSearches.filter((p) => p._id !== profile._id);
            setRecentSearches(updated);
            localStorage.setItem("recent_searches", JSON.stringify(updated));
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
        >
          <FiX className="text-gray-400" size={16} />
        </button>
      ) : (
        <FiSearch className="text-gray-400" size={16} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">

      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-300" />
              </svg>
            </button>

            <div className="flex-1 relative">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <FiSearch className="text-gray-400" size={20} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery.trim() || recentSearches.length > 0) setShowSuggestions(true); }}
                  placeholder="Search"
                  className="flex-1 outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                    <FiX className="text-gray-500 dark:text-gray-400" size={16} />
                  </button>
                )}
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUGGESTIONS */}
      {showSuggestions && (searchQuery.trim() || recentSearches.length > 0) && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-lg transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            {searchQuery.trim() && suggestions.length > 0 && (
              suggestions.map((profile) => <ProfileItem key={profile._id} profile={profile} />)
            )}

            {searchQuery.trim() && !loading && suggestions.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
              </div>
            )}

            {!searchQuery.trim() && recentSearches.length > 0 && (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent</p>
                  <button
                    onClick={() => { setRecentSearches([]); localStorage.removeItem("recent_searches"); }}
                    className="text-xs text-blue-500 font-medium hover:text-blue-600"
                  >
                    Clear all
                  </button>
                </div>
                {recentSearches.map((profile) => <ProfileItem key={profile._id} profile={profile} showRemove />)}
              </>
            )}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!showSuggestions && !searchQuery && (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Search</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Search for people by name</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}