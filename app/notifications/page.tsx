// app/notifications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { FaTimes, FaCheck, FaArrowLeft } from "react-icons/fa";

interface ConnectionRequest {
  _id: string;
  fromProfileId: {
    _id: string;
    name: string;
    imageUrl?: string;
    age: number;
    gender: string;
    tier: string;
    country?: string;
  };
  status: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const userStr = localStorage.getItem("myshine_user");
      if (!userStr) {
        router.push("/login");
        return;
      }

      const user = JSON.parse(userStr);
      if (!user.profileId) {
        alert("Profile not found");
        return;
      }

      const res = await fetch(`/api/connections/incoming?profileId=${user.profileId}`);
      const data = await res.json();

      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, action: "accepted" | "rejected") => {
    setProcessingId(requestId);

    try {
      const res = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();

      if (data.success) {
        // Remove from list
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
      } else {
        alert(data.message || "Failed to respond");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setProcessingId(null);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold":
        return "from-yellow-400 via-yellow-500 to-amber-500";
      case "silver":
        return "from-gray-300 via-gray-400 to-gray-500";
      case "bronze":
        return "from-orange-400 via-amber-600 to-orange-700";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="px-4 py-4 flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold">Connection Requests</h1>
            </div>
          </div>

          {/* Requests List */}
          <div className="p-4 space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No pending requests</p>
                <button
                  onClick={() => router.push("/")}
                  className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                >
                  Discover Profiles
                </button>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Profile Image */}
                    <div
                      onClick={() =>
                        router.push(`/profile/${request.fromProfileId._id}`)
                      }
                      className="cursor-pointer"
                    >
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTierColor(
                          request.fromProfileId.tier
                        )} p-[3px] hover:scale-105 transition-transform`}
                      >
                        <div
                          className="w-full h-full rounded-full bg-cover bg-center bg-gray-200"
                          style={{
                            backgroundImage: `url(${
                              request.fromProfileId.imageUrl ||
                              "/placeholder.jpg"
                            })`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {request.fromProfileId.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.fromProfileId.age} • {request.fromProfileId.gender} •{" "}
                        {request.fromProfileId.tier}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getTimeAgo(request.createdAt)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(request._id, "rejected")}
                        disabled={processingId === request._id}
                        className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        <FaTimes size={16} />
                      </button>
                      <button
                        onClick={() => handleRespond(request._id, "accepted")}
                        disabled={processingId === request._id}
                        className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        <FaCheck size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  );
}