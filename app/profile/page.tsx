"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import {
  FiMoreVertical, FiSettings, FiLogOut, FiHelpCircle,
  FiCamera, FiCheck, FiClock, FiX, FiMoon, FiSun, FiEdit2,
  FiBarChart2,
} from "react-icons/fi";
import { useDarkMode } from "@/app/contexts/DarkModeContext";

const COUNTRIES = [
  { value: "korea", label: "🇰🇷 Korea" },
  { value: "japan", label: "🇯🇵 Japan" },
  { value: "brazil", label: "🌎 Latin — Brazil" },
  { value: "colombia", label: "🌎 Latin — Colombia" },
  { value: "venezuela", label: "🌎 Latin — Venezuela" },
  { value: "argentina", label: "🌎 Latin — Argentina" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { dark, toggleDark } = useDarkMode();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPhoto, setVerifyPhoto] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyUploading, setVerifyUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const verifyFileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("myshine_user") || "{}")
      : null;

  useEffect(() => {
    if (!user?.loggedIn) router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/profile?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          const p = data.profile;
          setProfile(p);
          setName(p.name || "");
          setAge(p.age?.toString() || "");
          setBio(p.bio || "");
          setGender(p.gender || "");
          setCountry(p.country || "");
          setIsEditing(false);
          if (p._id && !user.profileId) {
            localStorage.setItem("myshine_user", JSON.stringify({ ...user, profileId: p._id, name: p.name }));
          }
        } else {
          setIsEditing(true);
        }
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!imagePreview || !profile?._id) return;
    try {
      setUploading(true);
      const res = await fetch("/api/profile/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile._id, imageBase64: imagePreview }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setImagePreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        alert("Profile photo saved!");
      } else alert("Upload failed");
    } catch { alert("Something went wrong"); }
    finally { setUploading(false); }
  };

  const handleVerifyPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setVerifyPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitVerification = async () => {
    if (!verifyPhone.trim()) return alert("Please enter your phone number");
    if (!verifyPhoto) return alert("Please upload a photo");
    if (!profile?._id) return alert("Save your profile first");

    try {
      setVerifyUploading(true);
      const res = await fetch("/api/profile/apply-homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile._id,
          verificationPhoto: verifyPhoto,
          phone: verifyPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev: any) => ({ ...prev, verificationStatus: "pending" }));
        setShowVerifyModal(false);
        setVerifyPhoto("");
        setVerifyPhone("");
        alert("Verification submitted! We'll review and approve you shortly.");
      } else alert(data.message || "Failed to submit");
    } catch { alert("Something went wrong"); }
    finally { setVerifyUploading(false); }
  };

  const saveProfile = async () => {
    if (!name.trim() || !gender || Number(age) <= 0) {
      return alert("Please fill all required fields correctly");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id, name, age: Number(age), bio, gender, country,
          isCameraVerified: profile?.isCameraVerified || false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("myshine_user", JSON.stringify({ ...user, profileId: data.profile._id, name: data.profile.name }));
        setProfile(data.profile);
        setIsEditing(false);
        alert("Profile saved successfully!");
      } else alert(data.message || "Failed to save profile");
    } catch { alert("Something went wrong"); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("myshine_user");
    router.replace("/login");
  };

  const renderVerificationStatus = () => {
    const status = profile?.verificationStatus || "none";

    if (status === "approved") return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl text-green-700 dark:text-green-400 text-sm">
        <FiCheck size={18} />
        <div>
          <p className="font-semibold">Verified & Live on Homepage</p>
          <p className="text-xs text-green-600 dark:text-green-500">Your profile is visible to others</p>
        </div>
      </div>
    );

    if (status === "pending") return (
      <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl text-yellow-700 dark:text-yellow-400 text-sm">
        <FiClock size={18} />
        <div>
          <p className="font-semibold">Verification Pending</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500">Admin is reviewing your submission</p>
        </div>
      </div>
    );

    if (status === "rejected") return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <FiX size={18} />
          <div>
            <p className="font-semibold">Verification Rejected</p>
            <p className="text-xs text-red-600 dark:text-red-500">Please try again with a clearer photo</p>
          </div>
        </div>
        <button
          onClick={() => setShowVerifyModal(true)}
          className="w-full py-3 border-2 border-pink-500 text-pink-500 rounded-xl font-semibold hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors flex items-center justify-center gap-2"
        >
          <FiCamera size={18} /> Apply to Homepage Again
        </button>
      </div>
    );

    if (profile?._id) return (
      <button
        onClick={() => setShowVerifyModal(true)}
        className="w-full py-3 border-2 border-pink-500 text-pink-500 rounded-xl font-semibold hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <FiCamera size={18} /> Apply to Homepage
      </button>
    );

    return null;
  };

  const inputClass = "w-full mt-1 p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass = "text-sm font-medium text-gray-600 dark:text-gray-400";

  const countryLabel = COUNTRIES.find((c) => c.value === country)?.label ||
    (country ? country.charAt(0).toUpperCase() + country.slice(1) : "—");

  return (
    <>
      <div className="min-h-screen bg-pink-50 dark:bg-gray-900 flex justify-center px-4 pb-28 transition-colors duration-300">
        <div className="w-full max-w-md md:max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow mt-6 p-6 md:p-8 relative transition-colors duration-300">

          {/* 3 DOT MENU */}
          <div className="absolute top-4 right-4 z-10" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <FiMoreVertical size={24} className="text-gray-700 dark:text-gray-300" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-fadeIn">

                {/* DARK MODE */}
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between text-gray-700 dark:text-gray-300 transition-colors"
                  onClick={toggleDark}
                >
                  <div className="flex items-center gap-3">
                    {dark ? <FiSun size={18} className="text-yellow-400" /> : <FiMoon size={18} />}
                    <span>{dark ? "Light Mode" : "Dark Mode"}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${dark ? "bg-pink-500" : "bg-gray-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </button>

                {/* ANALYTICS */}
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 transition-colors"
                  onClick={() => { setMenuOpen(false); router.push("/analytics"); }}
                >
                  <FiBarChart2 size={18} />
                  <span>Analytics</span>
                </button>

                {/* HELP */}
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 transition-colors"
                  onClick={() => { setMenuOpen(false); alert("Help & Support\n\nContact: support@myshine.com"); }}
                >
                  <FiHelpCircle size={18} />
                  <span>Help & Support</span>
                </button>

                {/* SETTINGS */}
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 transition-colors"
                  onClick={() => { setMenuOpen(false); alert("Settings coming soon!"); }}
                >
                  <FiSettings size={18} />
                  <span>Settings</span>
                </button>

                {/* LOGOUT */}
                <button
                  className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 text-red-600 dark:text-red-400 border-t border-gray-100 dark:border-gray-700 transition-colors"
                  onClick={handleLogout}
                >
                  <FiLogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">My Profile</h2>

          {/* PROFILE IMAGE */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center text-gray-500 dark:text-gray-400">
                {imagePreview || profile?.imageUrl ? (
                  <img src={imagePreview || profile.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm">Photo</span>
                )}
              </div>

              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />

              {profile?.verificationStatus === "approved" && (
                <div className="absolute bottom-1 right-1 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">✓</div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-xs px-3 py-1 rounded-full hover:bg-pink-600 transition-colors"
              >
                Edit
              </button>
            </div>

            {imagePreview && (
              <button
                onClick={handleImageUpload}
                disabled={uploading}
                className="mt-3 w-full bg-green-500 text-white text-sm py-2 rounded-xl disabled:opacity-50 hover:bg-green-600 transition-colors"
              >
                {uploading ? "Uploading..." : "Save Photo"}
              </button>
            )}
          </div>

          {/* VIEW MODE */}
          {!isEditing && profile ? (
            <div className="space-y-3 mb-6">
              {[
                { label: "Name", value: name },
                { label: "Age", value: age },
                { label: "Gender", value: gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "—" },
                { label: "Bio", value: bio || "—" },
                { label: "Country", value: countryLabel },
              ].map((item) => (
                <div key={item.label} className="flex flex-col">
                  <span className={labelClass}>{item.label}</span>
                  <span className="mt-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm">
                    {item.value}
                  </span>
                </div>
              ))}

              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <FiEdit2 size={16} />
                Edit Profile
              </button>
            </div>
          ) : (
            /* EDIT MODE */
            <div className="space-y-4 mb-4">
              <div>
                <label className={labelClass}>Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Age *</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Your age" min="18" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Gender *</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Bio</label>
                <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." className={inputClass + " resize-none"} />
              </div>

              <div>
                <label className={labelClass}>Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <button
                onClick={saveProfile}
                disabled={loading}
                className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-pink-600 transition-colors"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>

              {profile && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-full py-3 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {/* APPLY TO HOMEPAGE */}
          <div className="mt-2">
            {renderVerificationStatus()}
          </div>
        </div>
      </div>

      {/* VERIFICATION MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm transition-colors duration-300">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Apply to Homepage</h3>
              <button onClick={() => { setShowVerifyModal(false); setVerifyPhoto(""); setVerifyPhone(""); }}>
                <FiX size={22} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* NAME (read-only from profile) */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                Name
              </label>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm">
                {name || "—"}
              </div>
            </div>

            {/* PHONE NUMBER */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                Phone Number *
              </label>
              <input
                type="tel"
                value={verifyPhone}
                onChange={(e) => setVerifyPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
              />
            </div>

            {/* VERIFICATION PHOTO */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                Verification Photo *
              </label>

              {verifyPhoto ? (
                <div className="relative">
                  <img src={verifyPhoto} alt="Verification" className="w-full h-44 object-cover rounded-xl" />
                  <button
                    onClick={() => setVerifyPhoto("")}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => verifyFileInputRef.current?.click()}
                  className="w-full h-44 border-2 border-dashed border-pink-300 dark:border-pink-700 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                >
                  <FiCamera size={32} className="text-pink-400" />
                  <p className="text-sm text-pink-400 font-medium">Tap to take/upload photo</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Clear selfie works best</p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                capture="user"
                ref={verifyFileInputRef}
                onChange={handleVerifyPhotoSelect}
                className="hidden"
              />
            </div>

            {/* SUBMIT */}
            <button
              onClick={handleSubmitVerification}
              disabled={!verifyPhoto || !verifyPhone.trim() || verifyUploading}
              className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-pink-600 transition-colors"
            >
              {verifyUploading ? "Submitting..." : "Submit for Verification"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </>
  );
}