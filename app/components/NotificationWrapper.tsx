// app/components/NotificationWrapper.tsx - Updated with ConnectedToast
"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import ConnectionToast from "./ConnectionToast";
import ConnectedToast from "./ConnectedToast";
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
  const router = useRouter();
  const [currentNotification, setCurrentNotification] = useState<PendingNotification | null>(null);
  const [showConnectedToast, setShowConnectedToast] = useState(false);
  const [acceptanceNotification, setAcceptanceNotification] = useState<AcceptanceNotification | null>(null);
  const [declinedNotification, setDeclinedNotification] = useState<DeclinedNotification | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const paymentTimeoutHandledRef = useRef(false);
  const declinedTimeoutHandledRef = useRef(false);
  const redirectProfileIdRef = useRef<string | null>(null);

  // Initialize socket
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        await fetch("/api/socket");
        console.log("✅ Socket server ready");
      } catch (err) {
        console.error("❌ Socket server initialization failed:", err);
      }

      const userStr = localStorage.getItem("myshine_user");
      if (!userStr) return;

      const user = JSON.parse(userStr);
      if (!user.profileId) return;

      setProfileId(user.profileId);

      if (!socketRef.current) {
        const newSocket = io({ path: "/api/socket" });
        socketRef.current = newSocket;

        newSocket.on("connect", () => {
          console.log("🔔 Socket connected:", newSocket.id);
          const userRoom = `user:${user.profileId}`;
          newSocket.emit("join-user-room", userRoom);
        });

        newSocket.on("connection-request-received", (data: PendingNotification) => {
          console.log("🔔 Connection request received:", data);
          setCurrentNotification(data);
        });

        newSocket.on("connection-accepted-notify", (data: AcceptanceNotification) => {
          console.log("💰 Payment notification:", data);
          paymentTimeoutHandledRef.current = false;
          setAcceptanceNotification(data);
        });

        newSocket.on("payment-declined-notify", (data: DeclinedNotification) => {
          console.log("❌ Payment declined:", data);
          declinedTimeoutHandledRef.current = false;
          setDeclinedNotification(data);
        });
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current && profileId) {
        socketRef.current.emit("leave-user-room", `user:${profileId}`);
      }
    };
  }, [profileId]);

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
        
        // Store the profile ID for redirection
        const otherProfileId = currentNotification?.fromProfile._id;
        if (otherProfileId) {
          redirectProfileIdRef.current = otherProfileId;
        }

        // Close connection toast
        setCurrentNotification(null);
        
        // Show "Connected!" toast
        setShowConnectedToast(true);
        
        // After 2 seconds, redirect to chat
        setTimeout(() => {
          if (redirectProfileIdRef.current) {
            router.push(`/chat/${redirectProfileIdRef.current}`);
          }
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Error accepting connection:", err);
      setCurrentNotification(null);
    }
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
    console.log("⏰ Toast timeout - moving to notifications");
    window.dispatchEvent(new Event("refreshNotificationBadge"));
    setCurrentNotification(null);
  };

  const handlePaymentTimeout = async () => {
    if (paymentTimeoutHandledRef.current) return;
    paymentTimeoutHandledRef.current = true;
    
    console.log("⏰ Payment toast timeout");
    
    if (acceptanceNotification && profileId) {
      try {
        await fetch("/api/notifications/payment/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId,
            fromProfileId: acceptanceNotification.fromProfileId,
            requestId: acceptanceNotification.requestId,
            fromName: acceptanceNotification.fromName,
            fromImageUrl: acceptanceNotification.fromImageUrl,
            tier: acceptanceNotification.tier,
          }),
        });
        
        window.dispatchEvent(new Event("refreshNotificationBadge"));
      } catch (err) {
        console.error("Failed to save payment notification:", err);
      }
    }
    
    setAcceptanceNotification(null);
  };

  const handleDeclinedTimeout = () => {
    if (declinedTimeoutHandledRef.current) return;
    declinedTimeoutHandledRef.current = true;
    setDeclinedNotification(null);
  };

  return (
    <>
      {/* Connection Request Toast */}
      {currentNotification && (
        <ConnectionToast
          fromProfile={currentNotification.fromProfile}
          requestId={currentNotification.requestId}
          onAccept={handleAccept}
          onReject={handleReject}
          onTimeout={handleTimeout}
        />
      )}

      {/* Connected Toast - Shows after accepting */}
      {showConnectedToast && (
        <ConnectedToast onClose={() => setShowConnectedToast(false)} />
      )}

      {/* Payment Toast */}
      {acceptanceNotification && (
        <PaymentAcceptanceToast
          fromProfileId={acceptanceNotification.fromProfileId}
          fromName={acceptanceNotification.fromName}
          fromImageUrl={acceptanceNotification.fromImageUrl}
          tier={acceptanceNotification.tier}
          requestId={acceptanceNotification.requestId}
          onTimeout={handlePaymentTimeout}
          onClose={() => {
            paymentTimeoutHandledRef.current = false;
            setAcceptanceNotification(null);
          }}
        />
      )}

      {/* Payment Declined Toast */}
      {declinedNotification && (
        <PaymentDeclinedToast
          fromProfileId={declinedNotification.fromProfileId}
          requestId={declinedNotification.requestId}
          onTimeout={handleDeclinedTimeout}
          onClose={() => {
            declinedTimeoutHandledRef.current = false;
            setDeclinedNotification(null);
          }}
        />
      )}
    </>
  );
}