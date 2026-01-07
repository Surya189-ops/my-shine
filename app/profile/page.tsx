"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

type Tier = "bronze" | "silver" | "gold" | "";

export default function ProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [tier, setTier] = useState<Tier>("");

  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------------- USER ---------------- */
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("myshine_user") || "{}")
      : null;

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    if (!user?.loggedIn) {
      router.replace("/login");
    }
  }, [router]);

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    if (!user?.id) return;

    fetch(`/api/profile?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setProfile(data.profile);
          setName(data.profile.name || "");
          setAge(data.profile.age?.toString() || "");
          setBio(data.profile.bio || "");
          setGender(data.profile.gender || "");

          // ✅ FIX: Only set tier if gender is male or female
          if (data.profile.gender === "male" || data.profile.gender === "female") {
            setTier(data.profile.tier || "");
          } else {
            setTier("");
          }

          setIsVerified(data.profile.isCameraVerified || false);

          // ✅ NEW: Update localStorage with profileId if missing
          if (data.profile._id && !user.profileId) {
            const updatedUser = {
              ...user,
              profileId: data.profile._id,
              name: data.profile.name,
            };
            localStorage.setItem("myshine_user", JSON.stringify(updatedUser));
            console.log("✅ ProfileId added to localStorage:", data.profile._id);
          }
        }
      });
  }, []);

  /* ---------------- IMAGE PREVIEW ---------------- */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ---------------- IMAGE UPLOAD ---------------- */
  const handleImageUpload = async () => {
    if (!imagePreview || !profile?._id) return;

    try {
      setUploading(true);

      const res = await fetch("/api/profile/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile._id,
          imageBase64: imagePreview,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setProfile(data.profile);
        setImagePreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        alert("Profile image saved");
      } else {
        alert("Upload failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- VERIFY ---------------- */
  const handleVerify = () => {
    setTimeout(() => setIsVerified(true), 500);
  };

  /* ---------------- SAVE PROFILE ---------------- */
  const saveProfile = async () => {
    if (!name.trim() || !gender || Number(age) <= 0) {
      alert("Please fill all required fields correctly");
      return;
    }

    if ((gender === "male" || gender === "female") && !tier) {
      alert("Please select a tier");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        userId: user.id,
        name,
        age: Number(age),
        bio,
        gender,
        isCameraVerified: isVerified,
      };

      // ✅ only include tier for male/female
      if (gender === "male" || gender === "female") {
        payload.tier = tier;
      }

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        // ✅ NEW: Update localStorage with profileId and name
        const updatedUser = {
          ...user,
          profileId: data.profile._id,
          name: data.profile.name,
        };
        localStorage.setItem("myshine_user", JSON.stringify(updatedUser));
        console.log("✅ Profile saved with profileId:", data.profile._id);

        // Update local state
        setProfile(data.profile);

        alert("Profile saved successfully");
        
        // ✅ Redirect to homepage after successful save
        router.push("/");
      } else {
        alert(data.message || "Failed to save profile");
      }
    } catch (err) {
      console.error("❌ Profile save error:", err);
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
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-500">
                {imagePreview || profile?.imageUrl ? (
                  <img
                    src={imagePreview || profile.imageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>Profile Pic</span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
              />

              {isVerified && (
                <div className="absolute bottom-1 right-1 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  ✓
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-xs px-3 py-1 rounded-full"
              >
                Edit
              </button>
            </div>

            {imagePreview && (
              <button
                onClick={handleImageUpload}
                disabled={uploading}
                className="mt-3 w-full bg-green-500 text-white text-xs py-2 rounded disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Save Photo"}
              </button>
            )}
          </div>

          {/* NAME */}
          <div className="mb-4">
            <label className="text-sm text-gray-600">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-3 border rounded-lg"
            />
          </div>

          {/* AGE */}
          <div className="mb-4">
            <label className="text-sm text-gray-600">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full mt-1 p-3 border rounded-lg"
            />
          </div>

          {/* BIO */}
          <div className="mb-4">
            <label className="text-sm text-gray-600">Bio</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full mt-1 p-3 border rounded-lg resize-none"
            />
          </div>

          {/* GENDER */}
          <div className="mb-4">
            <label className="text-sm text-gray-600">Gender</label>
            <select
              value={gender}
              onChange={(e) => {
                const value = e.target.value;
                setGender(value);

                // clear tier ONLY for "other"
                if (value === "other" || value === "") {
                  setTier("");
                }
              }}
              className="w-full mt-1 p-3 border rounded-lg"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* TIER */}
          {(gender === "male" || gender === "female") && (
            <div className="mb-6">
              <label className="text-sm text-gray-600">Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as Tier)}
                className="w-full mt-1 p-3 border rounded-lg"
              >
                <option value="">Select tier</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
            </div>
          )}

          {/* VERIFY */}
          {gender === "male" && !isVerified && (
            <button
              onClick={handleVerify}
              className="w-full mb-4 py-3 border-2 border-pink-500 text-pink-500 rounded-lg font-semibold"
            >
              Verify with Camera
            </button>
          )}

          {/* SAVE */}
          <button
            onClick={saveProfile}
            disabled={loading}
            className="w-full py-3 bg-pink-500 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      <BottomNav />
    </>
  );
}