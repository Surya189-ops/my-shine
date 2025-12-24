"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiMessageCircle, FiCalendar } from "react-icons/fi";

type Profile = {
  _id: string;
  name: string;
  age: number;
  bio?: string;
  tier: "bronze" | "silver" | "gold";
  imageUrl?: string;
};

const tierStyles = {
  bronze: "bg-yellow-100 text-yellow-700",
  silver: "bg-gray-200 text-gray-700",
  gold: "bg-yellow-300 text-gray-900",
};

export default function ProfileViewPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.profileId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------- AUTH GUARD -------- */
  useEffect(() => {
    const user = localStorage.getItem("myshine_user");
    if (!user) router.replace("/login");
  }, [router]);

  /* -------- FETCH PROFILE -------- */
  useEffect(() => {
    if (!profileId) return;

    fetch(`/api/profile/by-id?profileId=${profileId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProfile(data.profile);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [profileId]);

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">Loading profile...</p>;
  }

  if (!profile) {
    return <p className="p-6 text-sm">Profile not found</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* -------- HEADER -------- */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-800">
          Profile Details
        </h1>
      </div>

      {/* -------- PROFILE CARD -------- */}
      <div className="max-w-md mx-auto mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">

        {/* IMAGE */}
        <div className="h-56 bg-gray-200">
          {profile.imageUrl ? (
            <img
              src={profile.imageUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-5">

          {/* NAME + BADGE */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {profile.name}
            </h2>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${tierStyles[profile.tier]}`}
            >
              {profile.tier.toUpperCase()}
            </span>
          </div>

          {/* META */}
          <p className="text-sm text-gray-500 mt-1">
            {profile.age} years old
          </p>

          {/* BIO */}
          {profile.bio && (
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* ACTIONS */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => router.push(`/chat/${profile._id}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              <FiMessageCircle />
              Chat
            </button>

            <button
              onClick={() => router.push("/")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-pink-500 text-white text-sm font-medium hover:bg-pink-600"
            >
              <FiCalendar />
              Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
