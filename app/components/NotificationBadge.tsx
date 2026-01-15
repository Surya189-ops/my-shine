// app/components/NotificationBadge.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";

type NotificationBadgeProps = {
  profileId: string;
  className?: string;
};

export default function NotificationBadge({ 
  profileId, 
  className = "" 
}: NotificationBadgeProps) {
  const [hasUnread, setHasUnread] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const pathname = usePathname();

  // Fetch initial unread count
  useEffect(() => {
    if (!profileId) return;
    fetchUnreadCount();
  }, [profileId]);

  // Refresh when navigating away from notifications page
  useEffect(() => {
    if (!profileId) return;
    
    // If user navigated away from notifications, refresh badge
    const timer = setTimeout(() => {
      fetchUnreadCount();
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, profileId]);

  // ✅ Listen for toast dismissal event
  useEffect(() => {
    const handleRefresh = () => {
      console.log("🔔 Badge: Toast dismissed, refreshing count");
      fetchUnreadCount();
    };

    window.addEventListener("refreshNotificationBadge", handleRefresh);

    return () => {
      window.removeEventListener("refreshNotificationBadge", handleRefresh);
    };
  }, [profileId]);

  // ✅ Setup socket for real-time updates
  useEffect(() => {
    if (!profileId) return;

    const initSocket = async () => {
      await fetch("/api/socket");

      const socket = io({ path: "/api/socket" });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-user-room", profileId);
        console.log("🔔 Badge socket connected");
      });

      // New connection request received
      socket.on("connection-request-received", () => {
        console.log("🔔 Badge: New request received");
        fetchUnreadCount();
      });

      // Connection response received
      socket.on("connection-response-received", () => {
        console.log("🔔 Badge: Response received");
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
      const res = await fetch(`/api/notifications/unread-count?profileId=${profileId}`);
      const data = await res.json();

      if (data.success) {
        const hasNew = data.unreadCount > 0;
        console.log(`🔔 Badge updated: ${data.unreadCount} unread (${hasNew ? "showing" : "hiding"} dot)`);
        setHasUnread(hasNew);
      }
    } catch (err) {
      console.error("❌ Badge: Failed to fetch count:", err);
    }
  };

  // Only show red dot if there are unread notifications
  if (!hasUnread) return null;

  return (
    <div
      className={`absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ${className}`}
      style={{
        boxShadow: "0 0 8px rgba(239, 68, 68, 0.8)",
      }}
    />
  );
}