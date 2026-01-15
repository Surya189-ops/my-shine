// app/components/UnreadBadge.tsx - Badge positioned like Instagram (on top of icon)
"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

type UnreadBadgeProps = {
  profileId: string;
  className?: string;
};

export default function UnreadBadge({ profileId, className = "" }: UnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial unread count
  useEffect(() => {
    if (!profileId) return;

    fetchUnreadCount();
  }, [profileId]);

  // Setup socket listener for real-time updates
  useEffect(() => {
    if (!profileId) return;

    const initSocket = async () => {
      await fetch("/api/socket");

      const socket = io({
        path: "/api/socket",
      });

      socketRef.current = socket;

      // Join user room for notifications
      socket.on("connect", () => {
        const userRoom = `user:${profileId}`;
        socket.emit("join-user-room", userRoom);
        console.log("🔔 UnreadBadge connected to room:", userRoom);
      });

      // Listen for new messages
      socket.on("new-message-notification", () => {
        console.log("📬 New message notification received");
        fetchUnreadCount();
      });

      // Listen for messages being read
      socket.on("messages-marked-read", () => {
        console.log("👁️ Messages marked as read");
        fetchUnreadCount();
      });
    };

    initSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [profileId]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`/api/chat/unread-count?profileId=${profileId}`);
      const data = await res.json();

      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  if (unreadCount === 0) return null;

  return (
    <div
      className={`absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg border-2 border-gray-50 ${className}`}
      style={{
        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
      }}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </div>
  );
}