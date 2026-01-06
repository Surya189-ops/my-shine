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
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) return;

    const user = JSON.parse(userStr);
    if (!user.profileId) return;

    setProfileId(user.profileId);

    // Initialize socket if not already connected
    if (!socket) {
      socket = io({
        path: "/api/socket",
      });

      socket.on("connect", () => {
        console.log("🔔 Notification socket connected");
        socket?.emit("join-user-room", user.profileId);
      });

      socket.on("disconnect", () => {
        console.log("🔔 Notification socket disconnected");
      });
    } else if (socket.connected) {
      socket.emit("join-user-room", user.profileId);
    }

    // Listen for connection requests
    socket.on("connection-request-received", (data: PendingNotification) => {
      console.log("🔔 Received connection request:", data);
      
      // Add to queue if there's already a notification showing
      if (currentNotification) {
        setNotificationQueue((prev) => [...prev, data]);
      } else {
        setCurrentNotification(data);
      }
    });

    return () => {
      if (socket && user.profileId) {
        socket.emit("leave-user-room", user.profileId);
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