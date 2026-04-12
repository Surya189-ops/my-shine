"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiX, FiClock, FiUsers, FiTrendingUp } from "react-icons/fi";

type Stats = {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: number;
  revenueByTier: { Bronze: number; Silver: number; Gold: number };
};

type VerificationProfile = {
  _id: string;
  name: string;
  gender: string;
  country?: string;
  imageUrl?: string;
  verificationPhoto?: string;
  verificationStatus: string;
  createdAt: string;
};

type Tab = "stats" | "verification";

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingProfiles, setPendingProfiles] = useState<VerificationProfile[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [verifyLoading, setVerifyLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("verification");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* -------- FETCH STATS -------- */
  useEffect(() => {
    fetch("/api/admin/summary")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.stats);
        setStatsLoading(false);
      })
      .catch(() => setStatsLoading(false));
  }, []);

  /* -------- FETCH PENDING VERIFICATIONS -------- */
  const fetchPending = () => {
    setVerifyLoading(true);
    fetch("/api/admin/verification")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPendingProfiles(data.profiles);
        setVerifyLoading(false);
      })
      .catch(() => setVerifyLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  /* -------- APPROVE / REJECT -------- */
  const handleAction = async (profileId: string, action: "approve" | "reject") => {
    setActionLoading(profileId + action);
    try {
      const res = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingProfiles((prev) => prev.filter((p) => p._id !== profileId));
      } else {
        alert(data.message || "Action failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* HEADER */}
      <div className="bg-white shadow px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-pink-500">My Shine Admin</h1>
        <span className="text-xs text-gray-400">Dashboard</span>
      </div>

      {/* TABS */}
      <div className="flex bg-white border-b px-4">
        {[
          { key: "verification", label: "Verifications", icon: <FiUsers size={15} /> },
          { key: "stats", label: "Stats", icon: <FiTrendingUp size={15} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as Tab)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-pink-500 text-pink-500"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "verification" && pendingProfiles.length > 0 && (
              <span className="ml-1 bg-pink-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {pendingProfiles.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">

        {/* -------- VERIFICATION TAB -------- */}
        {activeTab === "verification" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">
                Pending Verifications ({pendingProfiles.length})
              </h2>
              <button
                onClick={fetchPending}
                className="text-xs text-pink-500 font-medium"
              >
                Refresh
              </button>
            </div>

            {verifyLoading ? (
              <p className="text-center text-gray-400 text-sm py-10">Loading...</p>
            ) : pendingProfiles.length === 0 ? (
              <div className="text-center py-16">
                <FiClock size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No pending verifications</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingProfiles.map((p) => (
                  <div key={p._id} className="bg-white rounded-2xl shadow p-4">

                    {/* PROFILE INFO */}
                    <div className="flex items-center gap-3 mb-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          className="w-12 h-12 rounded-full object-cover"
                          alt={p.name}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                          {p.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {p.gender} {p.country ? `· ${p.country}` : ""}
                        </p>
                      </div>
                      <span className="ml-auto text-[10px] text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <FiClock size={10} /> Pending
                      </span>
                    </div>

                    {/* VERIFICATION PHOTO */}
                    {p.verificationPhoto && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1 font-medium">Verification Photo</p>
                        <img
                          src={p.verificationPhoto}
                          alt="Verification"
                          className="w-full h-52 object-cover rounded-xl"
                        />
                      </div>
                    )}

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(p._id, "approve")}
                        disabled={actionLoading !== null}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-green-600 transition-colors"
                      >
                        <FiCheck size={16} />
                        {actionLoading === p._id + "approve" ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleAction(p._id, "reject")}
                        disabled={actionLoading !== null}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-red-600 transition-colors"
                      >
                        <FiX size={16} />
                        {actionLoading === p._id + "reject" ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------- STATS TAB -------- */}
        {activeTab === "stats" && (
          <div>
            {statsLoading ? (
              <p className="text-center text-gray-400 text-sm py-10">Loading...</p>
            ) : !stats ? (
              <p className="text-center text-red-400 text-sm py-10">Failed to load stats</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Total Revenue", value: `₹${stats.totalRevenue}` },
                    { label: "Total Bookings", value: stats.totalBookings },
                    { label: "Active", value: stats.activeBookings },
                    { label: "Completed", value: stats.completedBookings },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl p-4 shadow">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-lg font-bold text-gray-800 mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl p-4 shadow">
                  <h2 className="text-sm font-semibold mb-3 text-gray-700">Revenue by Tier</h2>
                  {Object.entries(stats.revenueByTier).map(([tier, amount]) => (
                    <div key={tier} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-600">{tier}</span>
                      <span className="font-semibold text-gray-800">₹{amount}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}