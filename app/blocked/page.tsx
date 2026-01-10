// app/blocked/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiXCircle } from "react-icons/fi";
import BottomNav from "@/app/components/BottomNav";

type BlockedUser = {
  _id: string;
  blockedProfileId: {
    _id: string;
    name: string;
    imageUrl?: string;
  };
  createdAt: string;
};

export default function BlockedUsersPage() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [myProfileId, setMyProfileId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(userStr);
    if (!user.profileId) {
      alert("Profile not found");
      router.replace("/profile");
      return;
    }

    setMyProfileId(user.profileId);
    fetchBlockedUsers(user.profileId);
  }, [router]);

  const fetchBlockedUsers = async (profileId: string) => {
    try {
      const res = await fetch(`/api/block?profileId=${profileId}`);
      const data = await res.json();

      if (data.success) {
        setBlockedUsers(data.blockedUsers);
      }
    } catch (err) {
      console.error("Fetch blocked users error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (blockedProfileId: string) => {
    if (!confirm("Unblock this user?")) return;

    try {
      const res = await fetch("/api/block", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockerProfileId: myProfileId,
          blockedProfileId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setBlockedUsers((prev) =>
          prev.filter((b) => b.blockedProfileId._id !== blockedProfileId)
        );
        alert("User unblocked successfully");
      } else {
        alert(data.message || "Failed to unblock user");
      }
    } catch (err) {
      console.error("Unblock error:", err);
      alert("Failed to unblock user");
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()}>
            <FiArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-semibold">Blocked Users</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent mx-auto" />
            <p className="text-gray-500 text-sm mt-3">Loading...</p>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-12">
            <FiXCircle size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No blocked users</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((block) => (
              <div
                key={block._id}
                className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {block.blockedProfileId.imageUrl ? (
                    <img
                      src={block.blockedProfileId.imageUrl}
                      alt={block.blockedProfileId.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                  )}

                  <div>
                    <p className="font-medium text-sm">
                      {block.blockedProfileId.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Blocked on {new Date(block.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleUnblock(block.blockedProfileId._id)}
                  className="px-4 py-2 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
} 