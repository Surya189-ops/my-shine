// app/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "./components/BottomNav";
import { FiChevronDown, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import DebugPanel from "./components/DebugPanel";

type Gender = "male" | "female" | "all";
type Place = "all" | "korea" | "japan" | "latin";

const LATIN_COUNTRIES = ["brazil", "colombia", "venezuela", "argentina"];
const PROFILES_PER_PAGE = 4;

type Profile = {
  _id: string;
  name: string;
  gender: string;
  country?: string;
  imageUrl?: string;
  tier?: string;
};

const isRealProfile = (profileId: any) => {
  if (!profileId) return false;
  return String(profileId).length === 24;
};

const defaultProfiles: Profile[] = [
  { _id: "d1", name: "Gojoooo", gender: "male", country: "japan", imageUrl: "/japan-male-1.jpg" },
  { _id: "d2", name: "king_sukunaa", gender: "male", country: "japan", imageUrl: "/japan-male-2.jpg" },
  { _id: "d3", name: "mikeykun", gender: "male", country: "japan", imageUrl: "/japan-male-3.jpg" },
  { _id: "d4", name: "Ninja naruto", gender: "male", country: "japan", imageUrl: "/japan-male-4.jpg" },
  { _id: "d5", name: "mitusurii", gender: "female", country: "japan", imageUrl: "/japan-female-1.jpg" },
  { _id: "d6", name: "cutie_Nezuko1", gender: "female", country: "japan", imageUrl: "/japan-female-2.jpg" },
  { _id: "d7", name: "henata_62", gender: "female", country: "japan", imageUrl: "/japan-female-3.jpg" },
  { _id: "d8", name: "utahime009", gender: "female", country: "japan", imageUrl: "/japan-female-4.jpg" },
  { _id: "d9", name: "K_Taehyung", gender: "male", country: "korea", imageUrl: "/korea-male-1.jpg" },
  { _id: "d10", name: "SeoulVibes", gender: "male", country: "korea", imageUrl: "/korea-male-2.jpg" },
  { _id: "d11", name: "Jungkook_95", gender: "male", country: "korea", imageUrl: "/korea-male-3.jpg" },
  { _id: "d12", name: "MinYoongi", gender: "male", country: "korea", imageUrl: "/korea-male-4.jpg" },
  { _id: "d13", name: "NamjoonKR", gender: "male", country: "korea", imageUrl: "/korea-male-5.jpg" },
  { _id: "d14", name: "HopeOnStreet", gender: "male", country: "korea", imageUrl: "/korea-male-6.jpg" },
  { _id: "d15", name: "JiminPark", gender: "male", country: "korea", imageUrl: "/korea-male-7.jpg" },
  { _id: "d16", name: "ShinWonho", gender: "male", country: "korea", imageUrl: "/korea-male-8.jpg" },
  { _id: "d17", name: "KangDaniel", gender: "male", country: "korea", imageUrl: "/korea-male-9.jpg" },
  { _id: "d18", name: "LeeKnow_SKZ", gender: "male", country: "korea", imageUrl: "/korea-male-10.jpg" },
];

export default function HomePage() {
  const router = useRouter();

  const [selectedPlace, setSelectedPlace] = useState<Place>("all");
  const [selectedGender, setSelectedGender] = useState<Gender>("all");
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [requestedProfiles, setRequestedProfiles] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  const placeRef = useRef<HTMLDivElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (placeRef.current && !placeRef.current.contains(e.target as Node))
        setShowPlaceDropdown(false);
      if (genderRef.current && !genderRef.current.contains(e.target as Node))
        setShowGenderDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) { router.replace("/login"); return; }
    const user = JSON.parse(userStr);

    fetch(`/api/profiles`)
      .then((res) => res.json())
      .then((data) => { if (data.success) setProfiles(data.profiles); setLoading(false); })
      .catch(() => setLoading(false));

    if (user.profileId) {
      fetch(`/api/messages/unread-conversations?profileId=${user.profileId}`)
        .then((res) => res.json())
        .then((data) => { if (data.success) setUnreadCount(data.unreadConversationCount); })
        .catch(console.error);
    }
  }, [router]);

  useEffect(() => {
    const handleRefresh = () => {
      const userStr = localStorage.getItem("myshine_user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      if (!user.profileId) return;
      fetch(`/api/messages/unread-conversations?profileId=${user.profileId}`)
        .then((res) => res.json())
        .then((data) => { if (data.success) setUnreadCount(data.unreadConversationCount); })
        .catch(console.error);
    };
    window.addEventListener("refreshMessageBadge", handleRefresh);
    return () => window.removeEventListener("refreshMessageBadge", handleRefresh);
  }, []);

  useEffect(() => { setCurrentPage(0); }, [selectedPlace, selectedGender]);

  const matchesPlace = (country?: string) => {
    if (selectedPlace === "all") return true;
    if (selectedPlace === "korea") return country === "korea";
    if (selectedPlace === "japan") return country === "japan";
    if (selectedPlace === "latin") return LATIN_COUNTRIES.includes(country || "");
    return true;
  };

  const matchesGender = (gender: string) =>
    selectedGender === "all" ? true : gender === selectedGender;

  const filteredReal = profiles.filter(
    (p) => matchesPlace(p.country) && matchesGender(p.gender)
  );

  const filteredDefaults = defaultProfiles.filter(
    (dp) =>
      matchesPlace(dp.country) &&
      matchesGender(dp.gender) &&
      !filteredReal.some((rp) => rp._id === dp._id)
  );

  const allProfiles = [...filteredReal, ...filteredDefaults];

  const startIndex = currentPage * PROFILES_PER_PAGE;
  const displayed = allProfiles.slice(startIndex, startIndex + PROFILES_PER_PAGE);
  const padded = [
    ...displayed,
    ...Array(Math.max(0, PROFILES_PER_PAGE - displayed.length)).fill(null),
  ];
  const hasMore = startIndex + PROFILES_PER_PAGE < allProfiles.length;
  const hasPrev = currentPage > 0;

  const comingSoon = () => alert("Coming Soon! This profile will be available shortly. 🌟");

  const handleConnect = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    if (!isRealProfile(profileId)) { comingSoon(); return; }
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) return alert("Please login first");
    const user = JSON.parse(userStr);
    if (!user.profileId) return alert("Complete your profile first");
    try {
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromProfileId: user.profileId, toProfileId: profileId }),
      });
      const data = await res.json();
      if (data.success) setRequestedProfiles((prev) => new Set(prev).add(profileId));
      else alert(data.message || "Request already sent");
    } catch { alert("Something went wrong"); }
  };

  const handleChat = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    if (!isRealProfile(profileId)) { comingSoon(); return; }
    router.push(`/chat/${profileId}`);
  };

  const handleProfileClick = (profileId: string) => {
    if (!isRealProfile(profileId)) { comingSoon(); return; }
    router.push(`/profile/${profileId}`);
  };

  const placeLabel = { all: "Place", korea: "Korea", japan: "Japan", latin: "Latin" }[selectedPlace];
  const genderLabel = { all: "Gen", male: "Male", female: "Female" }[selectedGender];

  if (loading)
    return (
      <p className="p-6 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 min-h-screen">
        Loading profiles…
      </p>
    );

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-3 pb-20 transition-colors duration-300">
        <div className="mx-auto max-w-[560px]">

          {/* HEADER */}
          <div className="py-3 sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 transition-colors duration-300">

            {/* TOP ROW */}
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-pink-500">My Shine</h1>
              <button
                onClick={() => router.push("/chats")}
                className="relative p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <IoChatbubbleEllipsesOutline size={22} className="text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </button>
            </div>

            {/* FILTER ROW */}
            <div className="flex items-center justify-center gap-2">

              {/* PLACE */}
              <div className="relative" ref={placeRef}>
                <button
                  onClick={() => { setShowPlaceDropdown((p) => !p); setShowGenderDropdown(false); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedPlace !== "all"
                      ? "bg-pink-500 text-white border-pink-500"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 shadow-sm"
                  }`}
                >
                  {placeLabel}
                  <FiChevronDown size={11} />
                </button>
                {showPlaceDropdown && (
                  <div className="absolute top-9 left-0 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-30 py-1 border border-gray-100 dark:border-gray-700">
                    {[
                      { value: "all", label: "All Places" },
                      { value: "korea", label: "🇰🇷 Korea" },
                      { value: "japan", label: "🇯🇵 Japan" },
                      { value: "latin", label: "🌎 Latin Countries" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSelectedPlace(opt.value as Place); setShowPlaceDropdown(false); }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedPlace === opt.value
                            ? "text-pink-600 font-semibold bg-pink-50 dark:bg-gray-700"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* GENDER */}
              <div className="relative" ref={genderRef}>
                <button
                  onClick={() => { setShowGenderDropdown((p) => !p); setShowPlaceDropdown(false); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedGender !== "all"
                      ? "bg-pink-500 text-white border-pink-500"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 shadow-sm"
                  }`}
                >
                  {genderLabel}
                  <FiChevronDown size={11} />
                </button>
                {showGenderDropdown && (
                  <div className="absolute top-9 left-0 w-28 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-30 py-1 border border-gray-100 dark:border-gray-700">
                    {[
                      { value: "all", label: "All" },
                      { value: "male", label: "♂ Male" },
                      { value: "female", label: "♀ Female" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSelectedGender(opt.value as Gender); setShowGenderDropdown(false); }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedGender === opt.value
                            ? "text-pink-600 font-semibold bg-pink-50 dark:bg-gray-700"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TOUR */}
              <button
                onClick={() => router.push("/tour")}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-pink-50 dark:hover:bg-gray-700 hover:text-pink-500 hover:border-pink-300 transition-all"
              >
                Tour
              </button>
            </div>
          </div>

          {/* PROFILE GRID */}
          <div className="mt-2 flex items-center gap-2">

            {/* LEFT ARROW */}
            <div className="w-8 flex-shrink-0">
              {hasPrev && (
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="w-8 h-8 rounded-full bg-pink-500 text-white shadow-lg flex items-center justify-center hover:bg-pink-600 transition-all hover:scale-110 active:scale-95"
                >
                  <FiChevronLeft size={16} />
                </button>
              )}
            </div>

            {/* GRID */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              {padded.map((profile, idx) =>
                profile ? (
                  <div
                    key={profile._id}
                    onClick={() => handleProfileClick(profile._id)}
                    className="rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm flex flex-col cursor-pointer hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
                  >
                    {/* IMAGE — fixed height */}
                    <div
                      className="bg-gray-200 dark:bg-gray-700 bg-cover bg-top w-full flex-shrink-0"
                      style={{
                        backgroundImage: `url(${profile.imageUrl || "/placeholder.jpg"})`,
                        height: "200px",
                      }}
                    />

                    {/* INFO — fixed height with padding */}
                    <div className="px-2 pt-2 pb-2 flex flex-col gap-1">
                      <p className="text-sm font-semibold text-center truncate text-gray-800 dark:text-gray-100">
                        {profile.name}
                      </p>
                      <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 capitalize">
                        {profile.country || ""}
                      </p>
                      <div className="flex gap-1.5 mt-1 w-full">
                        <button
                          onClick={(e) => handleConnect(e, profile._id)}
                          className={`flex-1 text-white text-[11px] py-1.5 rounded font-medium transition-all active:scale-95 ${
                            requestedProfiles.has(profile._id)
                              ? "bg-green-500"
                              : "bg-pink-500 hover:bg-pink-600"
                          }`}
                        >
                          {requestedProfiles.has(profile._id) ? "Sent ✓" : "Connect"}
                        </button>
                        <button
                          onClick={(e) => handleChat(e, profile._id)}
                          className="flex-1 border border-pink-500 text-pink-500 text-[11px] py-1.5 rounded font-medium bg-transparent hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all active:scale-95"
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={`empty-${idx}`}
                    className="rounded-lg bg-gray-100 dark:bg-gray-800"
                    style={{ height: "265px" }}
                  />
                )
              )}
            </div>

            {/* RIGHT ARROW */}
            <div className="w-8 flex-shrink-0">
              {hasMore && (
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="w-8 h-8 rounded-full bg-pink-500 text-white shadow-lg flex items-center justify-center hover:bg-pink-600 transition-all hover:scale-110 active:scale-95"
                >
                  <FiChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      <BottomNav />
      <DebugPanel />
    </>
  );
}