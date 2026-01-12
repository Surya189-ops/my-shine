// app/components/NotificationWrapper.tsx - FIXED (No Duplicates)
"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import ConnectionToast from "./ConnectionToast";
import PaymentAcceptanceToast from "./PaymentAcceptanceToast";
import PaymentDeclinedToast from "./PaymentDeclinedToast";

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

interface AcceptanceNotification {
  fromProfileId: string;
  fromName: string;
  fromImageUrl?: string;
  tier: string;
  requestId: string;
  timestamp: string;
}

interface DeclinedNotification {
  fromProfileId: string;
  requestId: string;
  timestamp: string;
}

export default function NotificationWrapper() {
  const [currentNotification, setCurrentNotification] =
    useState<PendingNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<
    PendingNotification[]
  >([]);
  const [acceptanceNotification, setAcceptanceNotification] =
    useState<AcceptanceNotification | null>(null);
  const [declinedNotification, setDeclinedNotification] =
    useState<DeclinedNotification | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const paymentTimeoutHandledRef = useRef(false); // ✅ Prevent duplicate saves
  const declinedTimeoutHandledRef = useRef(false); // ✅ Prevent duplicate declined saves

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
      if (!userStr) {
        console.warn("⚠️ No user found in localStorage");
        return;
      }

      const user = JSON.parse(userStr);
      if (!user.profileId) {
        console.warn("⚠️ No profileId found in localStorage");
        return;
      }

      setProfileId(user.profileId);
      console.log("👤 Current user profileId:", user.profileId);

      // Initialize socket if not already connected
      if (!socketRef.current) {
        console.log("🔌 Creating new socket connection for profileId:", user.profileId);
        
        const newSocket = io({
          path: "/api/socket",
        });

        socketRef.current = newSocket;

        newSocket.on("connect", () => {
          console.log("🔔 Notification socket connected, ID:", newSocket.id);
          const userRoom = `user:${user.profileId}`;
          console.log("👤 Joining user room:", userRoom);
          newSocket.emit("join-user-room", userRoom);
        });

        newSocket.on("disconnect", () => {
          console.log("🔔 Notification socket disconnected");
        });

        newSocket.on("connect_error", (error) => {
          console.error("❌ Socket connection error:", error);
        });

        // Listen for connection requests (Person B receives this)
        newSocket.on("connection-request-received", (data: PendingNotification) => {
          console.log("🔔 ✅✅✅ RECEIVED CONNECTION REQUEST:", data);
          console.log("📦 Data details:", JSON.stringify(data, null, 2));
          
          // ✅ ALWAYS show notification immediately (we'll handle queue in state update)
          setCurrentNotification(data);
        });

        // ✅ Listen for acceptance notification (Person A receives this for payment)
        newSocket.on("connection-accepted-notify", (data: AcceptanceNotification) => {
          console.log("💰 ✅✅✅ CONNECTION ACCEPTED - SHOW PAYMENT TOAST:", data);
          paymentTimeoutHandledRef.current = false; // ✅ Reset for new notification
          setAcceptanceNotification(data);
        });

        // ✅ Listen for declined notification (Person B receives this when payment declined)
        newSocket.on("payment-declined-notify", (data: DeclinedNotification) => {
          console.log("❌ ✅✅✅ PAYMENT DECLINED - SHOW DECLINED TOAST:", data);
          declinedTimeoutHandledRef.current = false; // ✅ Reset for new notification
          setDeclinedNotification(data);
        });

        // ✅ Debug: Listen for ANY socket event
        newSocket.onAny((eventName, ...args) => {
          console.log(`🔊 Socket event received: ${eventName}`, args);
        });
      } else if (socketRef.current.connected) {
        console.log("🔄 Socket already connected, re-joining room:", user.profileId);
        const userRoom = `user:${user.profileId}`;
        socketRef.current.emit("join-user-room", userRoom);
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current && profileId) {
        const userRoom = `user:${profileId}`;
        socketRef.current.emit("leave-user-room", userRoom);
      }
    };
  }, [profileId]);

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
        
        // ✅ Get user info from localStorage
        const userStr = localStorage.getItem("myshine_user");
        const user = userStr ? JSON.parse(userStr) : null;
        const myName = user?.name || "Someone";
        const myImageUrl = data.myProfile?.imageUrl || "";
        const myTier = data.myProfile?.tier || "bronze";
        
        // ✅ Emit socket event to notify Person A (sender)
        if (socketRef.current && currentNotification) {
          console.log("📤 Emitting connection-accepted to Person A");
          socketRef.current.emit("connection-accepted", {
            toProfileId: currentNotification.fromProfile._id, // Person A
            fromProfileId: profileId, // Person B (me)
            fromName: myName,
            fromImageUrl: myImageUrl,
            tier: myTier,
            requestId,
          });
        }

        // ✅ Redirect Person B to chat
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

  const handlePaymentTimeout = async () => {
    // ✅ Prevent duplicate saves
    if (paymentTimeoutHandledRef.current) {
      console.log("⚠️ Payment timeout already handled, skipping...");
      return;
    }

    paymentTimeoutHandledRef.current = true;
    
    console.log("⏰ Payment toast timed out - saving to notifications (20 min expiry)");
    
    // Save to notification center via API with 20-minute expiry
    if (acceptanceNotification && profileId) {
      try {
        await fetch("/api/notifications/payment/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId: profileId,
            fromProfileId: acceptanceNotification.fromProfileId,
            requestId: acceptanceNotification.requestId,
            fromName: acceptanceNotification.fromName,
            fromImageUrl: acceptanceNotification.fromImageUrl,
            tier: acceptanceNotification.tier,
          }),
        });
        console.log("✅ Payment notification saved with 20-minute expiry");
      } catch (err) {
        console.error("Failed to save payment notification:", err);
      }
    }
    
    setAcceptanceNotification(null);
  };

  const handleClosePaymentToast = () => {
    paymentTimeoutHandledRef.current = false; // ✅ Reset when manually closed
    setAcceptanceNotification(null);
  };

  const handleDeclinedTimeout = async () => {
    // ✅ Prevent duplicate saves
    if (declinedTimeoutHandledRef.current) {
      console.log("⚠️ Declined timeout already handled, skipping...");
      return;
    }

    declinedTimeoutHandledRef.current = true;
    
    console.log("⏰ Payment declined toast timed out - saving to notifications");
    
    // TODO: Save declined notification to database (optional)
    // For now, just close the toast
    
    setDeclinedNotification(null);
  };

  const handleCloseDeclinedToast = () => {
    declinedTimeoutHandledRef.current = false;
    setDeclinedNotification(null);
  };

  return (
    <>
      {/* Connection Request Toast (for Person B) */}
      {currentNotification && (
        <ConnectionToast
          fromProfile={currentNotification.fromProfile}
          requestId={currentNotification.requestId}
          onAccept={handleAccept}
          onReject={handleReject}
          onTimeout={handleTimeout}
        />
      )}

      {/* Payment Acceptance Toast (for Person A) */}
      {acceptanceNotification && (
        <PaymentAcceptanceToast
          fromProfileId={acceptanceNotification.fromProfileId}
          fromName={acceptanceNotification.fromName}
          fromImageUrl={acceptanceNotification.fromImageUrl}
          tier={acceptanceNotification.tier}
          requestId={acceptanceNotification.requestId}
          onTimeout={handlePaymentTimeout}
          onClose={handleClosePaymentToast}
        />
      )}

      {/* Payment Declined Toast (for Person B) */}
      {declinedNotification && (
        <PaymentDeclinedToast
          fromProfileId={declinedNotification.fromProfileId}
          requestId={declinedNotification.requestId}
          onTimeout={handleDeclinedTimeout}
          onClose={handleCloseDeclinedToast}
        />
      )}
    </>
  );
}