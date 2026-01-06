"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiMessageCircle, FiCalendar, FiMoreVertical, FiBookmark, FiShare2, FiAlertCircle, FiFlag } from "react-icons/fi";

type Profile = {
  _id: string;
  name: string;
  age?: number;
  bio?: string;
  tier: "bronze" | "silver" | "gold";
  gender: "male" | "female";
  country?: string;
  imageUrl?: string;
  isBusy?: boolean;
};

/* -------- DEFAULT PROFILES (SAME AS HOME PAGE) -------- */
const defaultProfiles: Profile[] = [
  // Bronze Female
  { _id: "b1", name: "Sophia", tier: "bronze", gender: "female", country: "korea", age: 24, bio: "Love dancing and meeting new people! Let's chat about K-pop and culture.", isBusy: false },
  { _id: "b2", name: "Camila", tier: "bronze", gender: "female", country: "japan", age: 22, bio: "Japanese culture enthusiast. I enjoy anime, manga, and traditional tea ceremonies.", isBusy: true },
  { _id: "b3", name: "Ana", tier: "bronze", gender: "female", country: "brazil", age: 23, bio: "Brazilian sunshine! Love samba, beaches, and making new connections.", isBusy: false },
  { _id: "b4", name: "Maria", tier: "bronze", gender: "female", country: "france", age: 25, bio: "Parisian vibes and good conversations. Let's talk about art and life!", isBusy: false },
  { _id: "b5", name: "Julia", tier: "bronze", gender: "female", country: "spain", age: 21, bio: "Spanish soul with passion for flamenco and late-night conversations.", isBusy: true },
  { _id: "b6", name: "Gabriela", tier: "bronze", gender: "female", country: "korea", age: 26, bio: "Seoul based, love fashion and beauty. Let's connect!", isBusy: false },
  { _id: "b7", name: "Luna", tier: "bronze", gender: "female", country: "japan", age: 20, bio: "Tokyo nights and city lights. Creative soul looking for interesting chats.", isBusy: false },
  { _id: "b8", name: "Valentina", tier: "bronze", gender: "female", country: "brazil", age: 24, bio: "Rio de Janeiro energy! Love music, dance, and positive vibes.", isBusy: false },

  // Bronze Male
  { _id: "b9", name: "Raymond", tier: "bronze", gender: "male", country: "usa", age: 28, bio: "American entrepreneur. Love tech, sports, and meaningful conversations.", isBusy: false },
  { _id: "b10", name: "Kenji", tier: "bronze", gender: "male", country: "brazil", age: 27, bio: "Brazilian-Japanese mix. Passionate about martial arts and philosophy.", isBusy: false },
  { _id: "b11", name: "Carlos", tier: "bronze", gender: "male", country: "colombia", age: 25, bio: "Colombian coffee lover. Let's talk about travel and adventures.", isBusy: true },
  { _id: "b12", name: "Lucas", tier: "bronze", gender: "male", country: "venezuela", age: 26, bio: "Venezuelan spirit. Music producer and creative thinker.", isBusy: false },
  { _id: "b13", name: "Diego", tier: "bronze", gender: "male", country: "argentina", age: 29, bio: "Buenos Aires based. Football fanatic and wine enthusiast.", isBusy: false },
  { _id: "b14", name: "Mateo", tier: "bronze", gender: "male", country: "usa", age: 24, bio: "West coast vibes. Tech enthusiast and outdoor adventurer.", isBusy: false },
  { _id: "b15", name: "Jae", tier: "bronze", gender: "male", country: "brazil", age: 23, bio: "São Paulo life. DJ and music lover looking for good connections.", isBusy: false },
  { _id: "b16", name: "Hiroshi", tier: "bronze", gender: "male", country: "colombia", age: 30, bio: "Japanese-Colombian. Chef and food culture explorer.", isBusy: false },

  // Silver Female
  { _id: "s1", name: "Valeria", tier: "silver", gender: "female", country: "korea", age: 27, bio: "Premium conversations and authentic connections. Korean culture expert.", isBusy: false },
  { _id: "s2", name: "Lucía", tier: "silver", gender: "female", country: "japan", age: 26, bio: "Tokyo sophistication. Model and lifestyle influencer.", isBusy: false },
  { _id: "s3", name: "Elena", tier: "silver", gender: "female", country: "brazil", age: 28, bio: "Brazilian elegance. Love fashion, travel, and deep conversations.", isBusy: true },
  { _id: "s4", name: "Sofia", tier: "silver", gender: "female", country: "france", age: 25, bio: "French charm. Artist and creative soul seeking meaningful chats.", isBusy: false },
  { _id: "s5", name: "Isabella", tier: "silver", gender: "female", country: "spain", age: 29, bio: "Spanish grace. Dancer and passionate about life experiences.", isBusy: false },
  { _id: "s6", name: "Natalia", tier: "silver", gender: "female", country: "korea", age: 24, bio: "Seoul lifestyle. Beauty and wellness enthusiast.", isBusy: false },
  { _id: "s7", name: "Camila", tier: "silver", gender: "female", country: "japan", age: 27, bio: "Kyoto elegance. Traditional meets modern lifestyle.", isBusy: false },
  { _id: "s8", name: "Andrea", tier: "silver", gender: "female", country: "brazil", age: 26, bio: "Brazilian sophistication. Entrepreneur and life coach.", isBusy: false },

  // Silver Male
  { _id: "s9", name: "Min Jae", tier: "silver", gender: "male", country: "usa", age: 30, bio: "Korean-American. Tech executive and mentor.", isBusy: false },
  { _id: "s10", name: "Pierre", tier: "silver", gender: "male", country: "brazil", age: 31, bio: "French-Brazilian. Wine expert and cultural bridge.", isBusy: true },
  { _id: "s11", name: "Hiro", tier: "silver", gender: "male", country: "colombia", age: 29, bio: "Japanese professional. Business and personal growth focused.", isBusy: false },
  { _id: "s12", name: "Rafael", tier: "silver", gender: "male", country: "venezuela", age: 28, bio: "Venezuelan businessman. Investment and lifestyle talks.", isBusy: false },
  { _id: "s13", name: "Javier", tier: "silver", gender: "male", country: "argentina", age: 32, bio: "Argentine gentleman. Polo player and wine connoisseur.", isBusy: false },
  { _id: "s14", name: "Jin", tier: "silver", gender: "male", country: "usa", age: 27, bio: "LA based. Entertainment industry professional.", isBusy: false },
  { _id: "s15", name: "Yuto", tier: "silver", gender: "male", country: "brazil", age: 30, bio: "Tokyo-Rio connection. International business consultant.", isBusy: false },
  { _id: "s16", name: "Miguel", tier: "silver", gender: "male", country: "colombia", age: 29, bio: "Colombian entrepreneur. Coffee business and global thinking.", isBusy: false },

  // Gold Female
  { _id: "g1", name: "Isabella", tier: "gold", gender: "female", country: "korea", age: 30, bio: "Elite conversations and premium experiences. Seoul's finest.", isBusy: false },
  { _id: "g2", name: "Emily", tier: "gold", gender: "female", country: "japan", age: 29, bio: "Tokyo luxury lifestyle. Model and brand ambassador.", isBusy: false },
  { _id: "g3", name: "Valentina", tier: "gold", gender: "female", country: "brazil", age: 31, bio: "Brazilian excellence. Top-tier experiences and authentic connections.", isBusy: false },
  { _id: "g4", name: "Martina", tier: "gold", gender: "female", country: "france", age: 28, bio: "Parisian luxury. Fashion icon and lifestyle curator.", isBusy: true },
  { _id: "g5", name: "Juliana", tier: "gold", gender: "female", country: "spain", age: 32, bio: "Spanish royalty vibes. Elite lifestyle and cultural experiences.", isBusy: false },
  { _id: "g6", name: "Amanda", tier: "gold", gender: "female", country: "korea", age: 27, bio: "Seoul premium. K-beauty entrepreneur and influencer.", isBusy: false },
  { _id: "g7", name: "Carolina", tier: "gold", gender: "female", country: "japan", age: 30, bio: "Japanese sophistication. International model and artist.", isBusy: false },
  { _id: "g8", name: "Daniela", tier: "gold", gender: "female", country: "brazil", age: 29, bio: "Brazilian luxury. High-end lifestyle and meaningful connections.", isBusy: false },

  // Gold Male
  { _id: "g9", name: "Takashi", tier: "gold", gender: "male", country: "usa", age: 35, bio: "Japanese-American executive. Silicon Valley success story.", isBusy: false },
  { _id: "g10", name: "Diego", tier: "gold", gender: "male", country: "brazil", age: 34, bio: "Brazilian mogul. Real estate and luxury lifestyle.", isBusy: false },
  { _id: "g11", name: "Seo-jun", tier: "gold", gender: "male", country: "colombia", age: 33, bio: "Korean entrepreneur. Global business and premium experiences.", isBusy: false },
  { _id: "g12", name: "Antoine", tier: "gold", gender: "male", country: "venezuela", age: 36, bio: "French-Venezuelan. Art collector and cultural patron.", isBusy: true },
  { _id: "g13", name: "Yuki", tier: "gold", gender: "male", country: "argentina", age: 32, bio: "Japanese executive. International markets and fine living.", isBusy: false },
  { _id: "g14", name: "Gabriel", tier: "gold", gender: "male", country: "usa", age: 31, bio: "American success. Tech entrepreneur and investor.", isBusy: false },
  { _id: "g15", name: "Mateo", tier: "gold", gender: "male", country: "brazil", age: 35, bio: "Brazilian elite. Finance and exclusive lifestyle.", isBusy: false },
  { _id: "g16", name: "Tae-hyung", tier: "gold", gender: "male", country: "colombia", age: 33, bio: "Korean-Colombian. Entertainment industry and luxury brands.", isBusy: false },
];

const tierStyles = {
  bronze: "bg-gradient-to-r from-orange-400 to-amber-600 text-white",
  silver: "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900",
  gold: "bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900",
};

const tierPricing = {
  bronze: { "30min": 199, "1hr": 299 },
  silver: { "30min": 499, "1hr": 699 },
  gold: { "30min": 1999, "1hr": 2999 },
};

export default function ProfileViewPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.profileId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"30min" | "1hr" | null>(null);

  /* -------- AUTH GUARD -------- */
  useEffect(() => {
    const user = localStorage.getItem("myshine_user");
    if (!user) router.replace("/login");
  }, [router]);

  /* -------- FETCH PROFILE (REAL OR DEFAULT) -------- */
  useEffect(() => {
    if (!profileId) return;

    // First check if it's a default profile
    const defaultProfile = defaultProfiles.find(p => p._id === profileId);

    if (defaultProfile) {
      setProfile(defaultProfile);
      setLoading(false);
      return;
    }

    // ✅ FIXED: Correct API route
    fetch(`/api/profile/by-id?profileId=${profileId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.profile);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [profileId]);

  /* -------- MENU ACTIONS -------- */
  const handleSaveProfile = () => {
    setIsSaved(!isSaved);
    setShowMenu(false);
    // TODO: API call to save/unsave profile
  };

  const handleShare = async () => {
    setShowMenu(false);
    const profileUrl = `${window.location.origin}/profile/${profileId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name} - My Shine`,
          text: `Check out ${profile?.name}'s profile on My Shine!`,
          url: profileUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      alert('Profile link copied to clipboard!');
    }
  };

  const handleBlock = () => {
    setShowMenu(false);
    if (confirm(`Are you sure you want to block ${profile?.name}?`)) {
      // TODO: API call to block user
      alert('User blocked successfully');
      router.push('/');
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    if (confirm(`Report ${profile?.name} for inappropriate behavior?`)) {
      // TODO: API call to report user
      alert('Report submitted. We will review this profile.');
    }
  };

  /* -------- SELECT PLAN -------- */
  const handleSelectPlan = (duration: "30min" | "1hr") => {
    if (profile?.isBusy) {
      alert(`${profile.name} is currently in another call. Please try again later.`);
      return;
    }
    setSelectedPlan(duration);
  };

  /* -------- PROCEED TO BOOKING -------- */
  const handleProceedToBook = () => {
    if (!selectedPlan) {
      alert('Please select a chat plan first');
      return;
    }
    const price = tierPricing[profile!.tier][selectedPlan];
    router.push(`/payment/${profileId}?duration=${selectedPlan}&price=${price}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-gray-700">Profile not found</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* -------- HEADER -------- */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FiArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-base font-semibold text-gray-800">
          Profile Details
        </h1>
      </div>

      {/* -------- PROFILE CARD -------- */}
      <div className="max-w-md mx-auto mt-6 px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* IMAGE */}
          <div className="relative h-72 bg-gradient-to-br from-pink-100 to-purple-100">
            {profile.imageUrl ? (
              <img
                src={profile.imageUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl text-gray-300">👤</div>
              </div>
            )}

            {/* TIER BADGE - TOP RIGHT */}
            <div className="absolute top-4 right-4">
              <span
                className={`text-xs px-4 py-2 rounded-full font-bold shadow-lg ${tierStyles[profile.tier]}`}
              >
                {profile.tier.toUpperCase()}
              </span>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6">

            {/* NAME + BUSY STATUS + MENU */}
            <div className="border-b pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {profile.name}
                    </h2>

                    {/* BUSY INDICATOR BESIDE NAME */}
                    {profile.isBusy && (
                      <span className="flex items-center gap-1 bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-full font-semibold">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        Busy
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                    {profile.age && <span>👤 {profile.age} years</span>}
                    {profile.country && (
                      <span>🌍 {profile.country.charAt(0).toUpperCase() + profile.country.slice(1)}</span>
                    )}
                  </div>
                </div>

                {/* THREE DOTS MENU - INSIDE CARD */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiMoreVertical size={20} className="text-gray-700" />
                  </button>

                  {/* DROPDOWN MENU */}
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowMenu(false)}
                      />

                      <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-xl border z-30 py-1">
                        <button
                          onClick={handleSaveProfile}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                        >
                          <FiBookmark size={16} className={isSaved ? "fill-pink-500 text-pink-500" : "text-gray-700"} />
                          <span>{isSaved ? "Unsave Profile" : "Save Profile"}</span>
                        </button>

                        <button
                          onClick={handleShare}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                        >
                          <FiShare2 size={16} className="text-gray-700" />
                          <span>Share</span>
                        </button>

                        <div className="border-t my-1" />

                        <button
                          onClick={handleBlock}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-600"
                        >
                          <FiAlertCircle size={16} />
                          <span>Block</span>
                        </button>

                        <button
                          onClick={handleReport}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-600"
                        >
                          <FiFlag size={16} />
                          <span>Report</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* BIO */}
            {profile.bio && (
              <div className="py-4 border-b">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  About
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* PRICING - SELECTABLE PLANS */}
            <div className="py-4 border-b">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Select Chat Plan
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSelectPlan("30min")}
                  disabled={profile.isBusy}
                  className={`rounded-lg p-4 text-center transition-all border-2 ${profile.isBusy
                      ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                      : selectedPlan === "30min"
                        ? 'bg-pink-500 border-pink-500 shadow-lg scale-105'
                        : 'bg-pink-50 border-pink-200 hover:border-pink-400 hover:shadow-md cursor-pointer'
                    }`}
                >
                  <p className={`text-xs mb-1 ${selectedPlan === "30min" ? 'text-white' : 'text-gray-600'}`}>
                    30 minutes
                  </p>
                  <p className={`text-lg font-bold ${selectedPlan === "30min" ? 'text-white' : 'text-pink-600'}`}>
                    ₹{tierPricing[profile.tier]["30min"]}
                  </p>
                  {selectedPlan === "30min" && (
                    <p className="text-[10px] text-pink-100 mt-1">✓ Selected</p>
                  )}
                </button>

                <button
                  onClick={() => handleSelectPlan("1hr")}
                  disabled={profile.isBusy}
                  className={`rounded-lg p-4 text-center transition-all border-2 ${profile.isBusy
                      ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                      : selectedPlan === "1hr"
                        ? 'bg-pink-500 border-pink-500 shadow-lg scale-105'
                        : 'bg-pink-50 border-pink-200 hover:border-pink-400 hover:shadow-md cursor-pointer'
                    }`}
                >
                  <p className={`text-xs mb-1 ${selectedPlan === "1hr" ? 'text-white' : 'text-gray-600'}`}>
                    1 hour
                  </p>
                  <p className={`text-lg font-bold ${selectedPlan === "1hr" ? 'text-white' : 'text-pink-600'}`}>
                    ₹{tierPricing[profile.tier]["1hr"]}
                  </p>
                  {selectedPlan === "1hr" && (
                    <p className="text-[10px] text-pink-100 mt-1">✓ Selected</p>
                  )}
                </button>
              </div>

              {profile.isBusy && (
                <p className="text-xs text-red-500 text-center mt-2 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  Currently in another call. Try again later.
                </p>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.push(`/chat/${profile._id}`)}
                disabled={profile.isBusy}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-pink-500 text-sm font-semibold transition-all active:scale-95 ${profile.isBusy
                    ? 'opacity-50 cursor-not-allowed text-gray-400 border-gray-300'
                    : 'text-pink-500 hover:bg-pink-50'
                  }`}
              >
                <FiMessageCircle size={18} />
                Chat Now
              </button>

              <button
                onClick={handleProceedToBook}
                disabled={profile.isBusy || !selectedPlan}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-lg ${profile.isBusy || !selectedPlan
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-pink-500 text-white hover:bg-pink-600'
                  }`}
              >
                <FiCalendar size={18} />
                {selectedPlan ? 'Book Session' : 'Select Plan First'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}