// app/components/NotificationWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import ConnectionToast from "./ConnectionToast";

interface PendingNotification {
  fromProfile: {
    _id: string;
    name: string;
    imageUrl?: string;
    age: number;
    gender: string;
    tier: string;
  };
  requestId: string;
  timestamp: string;
}

let socket: Socket | null = null;

export default function NotificationWrapper() {
  const [currentNotification, setCurrentNotification] =
    useState<PendingNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<
    PendingNotification[]
  >([]);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Initialize socket and join user room
  useEffect(() => {
    const initializeSocket = async () => {
      // First, ensure socket server is running
      try {
        await fetch("/api/socket");
        console.log("✅ Socket server ready");
      } catch (err) {
        console.error("❌ Socket server initialization failed:", err);
      }

      const userStr = localStorage.getItem("myshine_user");
      if (!userStr) return;

      const user = JSON.parse(userStr);
      if (!user.profileId) {
        console.warn("⚠️ No profileId found in localStorage");
        return;
      }

      setProfileId(user.profileId);
      console.log("👤 Current user profileId:", user.profileId);

      // Initialize socket if not already connected
      if (!socket) {
        console.log("🔌 Initializing socket for profileId:", user.profileId);
        
        socket = io({
          path: "/api/socket",
        });

        socket.on("connect", () => {
          console.log("🔔 Notification socket connected, ID:", socket?.id);
          console.log("👤 Joining user room:", user.profileId);
          socket?.emit("join-user-room", user.profileId);
        });

        socket.on("disconnect", () => {
          console.log("🔔 Notification socket disconnected");
        });

        socket.on("connect_error", (error) => {
          console.error("❌ Socket connection error:", error);
        });
      } else if (socket.connected) {
        console.log("🔄 Socket already connected, joining room:", user.profileId);
        socket.emit("join-user-room", user.profileId);
      }

      // Listen for connection requests
      socket.on("connection-request-received", (data: PendingNotification) => {
        console.log("🔔 ✅✅✅ RECEIVED CONNECTION REQUEST:", data);
        console.log("📦 Data details:", JSON.stringify(data, null, 2));
        
        // Add to queue if there's already a notification showing
        if (currentNotification) {
          console.log("📋 Adding to queue (notification already showing)");
          setNotificationQueue((prev) => [...prev, data]);
        } else {
          console.log("🎉 Showing notification immediately");
          setCurrentNotification(data);
        }
      });

      // ✅ Test: Listen for ANY socket event
      socket.onAny((eventName, ...args) => {
        console.log(`🔊 Socket event received: ${eventName}`, args);
      });
    };

    initializeSocket();

    return () => {
      if (socket && profileId) {
        socket.emit("leave-user-room", profileId);
      }
    };
  }, []);

  // Show next notification from queue
  useEffect(() => {
    if (!currentNotification && notificationQueue.length > 0) {
      const next = notificationQueue[0];
      setNotificationQueue((prev) => prev.slice(1));
      setCurrentNotification(next);
    }
  }, [currentNotification, notificationQueue]);

  const handleAccept = async (requestId: string) => {
    try {
      const res = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "accepted",
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("✅ Connection accepted");
        
        // Emit socket event to notify the sender
        if (socket && currentNotification) {
          socket.emit("connection-response-sent", {
            toProfileId: currentNotification.fromProfile._id,
            fromProfileId: profileId,
            fromName: "User", // You can get this from localStorage
            action: "accepted",
            requestId,
          });
        }

        // ✅ NEW: Redirect to chat with the person who sent the request
        const otherProfileId = currentNotification?.fromProfile._id;
        if (otherProfileId) {
          console.log("💬 Redirecting to chat with:", otherProfileId);
          window.location.href = `/chat/${otherProfileId}`;
        }
      }
    } catch (err) {
      console.error("❌ Error accepting connection:", err);
    }

    setCurrentNotification(null);
  };

  const handleReject = async (requestId: string) => {
    try {
      const res = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "rejected",
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("❌ Connection rejected");
        
        // Emit socket event to notify the sender
        if (socket && currentNotification) {
          socket.emit("connection-response-sent", {
            toProfileId: currentNotification.fromProfile._id,
            fromProfileId: profileId,
            fromName: "User", // You can get this from localStorage
            action: "rejected",
            requestId,
          });
        }
      }
    } catch (err) {
      console.error("❌ Error rejecting connection:", err);
    }

    setCurrentNotification(null);
  };

  const handleTimeout = () => {
    console.log("⏰ Notification timed out - moved to notification center");
    // Notification will be available in /notifications page via API
    setCurrentNotification(null);
  };

  if (!currentNotification) return null;

  return (
    <ConnectionToast
      fromProfile={currentNotification.fromProfile}
      requestId={currentNotification.requestId}
      onAccept={handleAccept}
      onReject={handleReject}
      onTimeout={handleTimeout}
    />
  );
}