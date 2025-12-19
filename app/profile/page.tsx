"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

export default function ProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- USER FROM LOCAL STORAGE ---------------- */
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("myshine_user") || "{}")
      : null;

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!user?.loggedIn) {
      router.replace("/login");
    }
  }, [router]);

  /* ---------------- LOAD PROFILE FROM DB ---------------- */
  useEffect(() => {
    if (!user?.id) return;

    fetch(`/api/profile?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setName(data.profile.name || "");
          setAge(data.profile.age?.toString() || "");
          setBio(data.profile.bio || "");
          setGender(data.profile.gender || "");
          setIsVerified(data.profile.isCameraVerified || false);
        }
      });
  }, []);

  /* ---------------- VERIFY (FAKE CAMERA) ---------------- */
  const handleVerify = () => {
    setTimeout(() => {
      setIsVerified(true);
    }, 500);
  };

  /* ---------------- SAVE PROFILE TO DB ---------------- */
  const saveProfile = async () => {
    if (!name || !age || !gender) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name,
          age: Number(age),
          bio,
          gender,
          isCameraVerified: isVerified,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Profile saved successfully");
      } else {
        alert("Failed to save profile");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-pink-50 flex justify-center px-4 pb-28">
        <div className="w-full max-w-md md:max-w-xl bg-white rounded-xl shadow mt-6 p-6 md:p-8">

          {/* PROFILE IMAGE */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                Profile Pic
              </div>

              {isVerified && (
                <div className="absolute bottom-1 right-1 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  ✓
                </div>
              )}

              <button className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-xs px-3 py-1 rounded-full">
                Edit
              </button>
            </div>
          </div>

          {/* NAME */}
          <div className="mb-4">
            <label className="text-sm text-gray-600">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full mt-1 p-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-pink-400 outline-none"
            />
          </div>

          {/* AGE */}
          <div className="mb-4">
            <label className="text-sm text-gray-600">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className="w-full mt-1 p-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-pink-400 outline-none"
            />
          </div>

          {/* BIO */}
          <div className="mb-4">
            <label className="text-sm text-gray-600">Bio</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself..."
              className="w-full mt-1 p-3 border rounded-lg text-gray-700 resize-none focus:ring-2 focus:ring-pink-400 outline-none"
            />
          </div>

          {/* GENDER */}
          <div className="mb-6">
            <label className="text-sm text-gray-600">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full mt-1 p-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-pink-400 outline-none"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* VERIFY / APPLY */}
          {gender === "male" && (
            <div className="mb-6">
              {!isVerified ? (
                <button
                  onClick={handleVerify}
                  className="w-full py-3 border-2 border-pink-500 text-pink-500 rounded-lg font-semibold hover:bg-pink-50 transition"
                >
                  Verify with Camera
                </button>
              ) : (
                <button
                  onClick={() => router.push("/")}
                  className="w-full py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition"
                >
                  Apply Connect to Home page
                </button>
              )}
            </div>
          )}

          {/* SAVE PROFILE */}
          <button
            onClick={saveProfile}
            disabled={loading}
            className="w-full py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
