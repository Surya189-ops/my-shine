// app/chats/page.tsx - Instagram-style chats list
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import BottomNav from "../components/BottomNav";

type Chat = {
  profileId: string;
  profile: {
    _id: string;
    name: string;
    imageUrl?: string;
    gender: string;
    tier: "bronze" | "silver" | "gold";
    country?: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isLastMessageFromMe: boolean;
};

export default function ChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [myProfileId, setMyProfileId] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(userStr);
    if (!user.profileId) {
      router.replace("/profile");
      return;
    }

    setMyProfileId(user.profileId);
    fetchChats(user.profileId);
  }, [router]);

  const fetchChats = async (profileId: string) => {
    try {
      const res = await fetch(`/api/chats?profileId=${profileId}`);
      const data = await res.json();

      if (data.success) {
        setChats(data.chats);
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (profileId: string) => {
    router.push(`/chat/${profileId}`);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold":
        return "ring-yellow-400";
      case "silver":
        return "ring-gray-400";
      case "bronze":
        return "ring-orange-500";
      default:
        return "ring-gray-300";
    }
  };

  // Filter chats based on search
  const filteredChats = chats.filter((chat) =>
    chat.profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-bold flex-1">Messages</h1>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <FiSearch className="text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages"
              className="flex-1 outline-none text-sm bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Chats List */}
      <div className="max-w-2xl mx-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center py-16">
            {searchQuery ? (
              <>
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-gray-500">No chats found</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Start a conversation with someone!
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                >
                  Discover People
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <div
                key={chat.profileId}
                onClick={() => handleChatClick(chat.profileId)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
              >
                {/* Profile Picture with Tier Ring */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-14 h-14 rounded-full ring-2 ${getTierColor(
                      chat.profile.tier
                    )}`}
                  >
                    {chat.profile.imageUrl ? (
                      <img
                        src={chat.profile.imageUrl}
                        alt={chat.profile.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                        {chat.profile.gender === "male" ? "👨" : "👩"}
                      </div>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {chat.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                    </div>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`text-sm truncate ${
                        chat.unreadCount > 0 ? "font-bold" : "font-medium"
                      }`}
                    >
                      {chat.profile.name}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {getTimeAgo(chat.lastMessageTime)}
                    </span>
                  </div>

                  <p
                    className={`text-sm truncate ${
                      chat.unreadCount > 0
                        ? "text-gray-900 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}