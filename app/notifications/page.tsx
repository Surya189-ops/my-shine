// app/notifications/page.tsx - WITH LONG-PRESS DELETE + 5 MIN TIMER
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { FaTimes, FaCheck, FaArrowLeft, FaMoneyBillWave, FaClock, FaTrash } from "react-icons/fa";

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

interface PaymentNotification {
  _id: string;
  fromProfileId: {
    _id: string;
    name: string;
    imageUrl?: string;
    tier: string;
  };
  requestId: string;
  fromName: string;
  fromImageUrl?: string;
  tier: string;
  expiresAt: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [paymentNotifications, setPaymentNotifications] = useState<PaymentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showDeleteFor, setShowDeleteFor] = useState<string | null>(null);
  
  // Long press detection
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
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

      // Fetch connection requests
      const connRes = await fetch(`/api/connections/incoming?profileId=${user.profileId}`);
      const connData = await connRes.json();

      if (connData.success) {
        setConnectionRequests(connData.requests);
      }

      // Fetch payment notifications
      const payRes = await fetch(`/api/notifications/payment?profileId=${user.profileId}`);
      const payData = await payRes.json();

      if (payData.success) {
        setPaymentNotifications(payData.notifications);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionRespond = async (
    requestId: string,
    action: "accepted" | "rejected",
    fromProfileId?: string
  ) => {
    setProcessingId(requestId);

    try {
      const res = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();

      if (data.success) {
        setConnectionRequests((prev) => prev.filter((r) => r._id !== requestId));

        if (action === "accepted" && fromProfileId) {
          console.log("💬 Connection accepted, redirecting to chat...");
          setTimeout(() => {
            router.push(`/chat/${fromProfileId}`);
          }, 500);
        }
      } else {
        alert(data.message || "Failed to respond");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePayNow = async (notification: PaymentNotification) => {
    // Remove notification from list
    await fetch(`/api/notifications/payment?notificationId=${notification._id}`, {
      method: "DELETE",
    });

    // Redirect to payment page
    router.push(`/payment?profileId=${notification.fromProfileId._id}&requestId=${notification.requestId}`);
  };

  // ✅ Long press handlers
  const handleTouchStart = (e: React.TouchEvent, notificationId: string) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    // Detect 2-finger touch (right-click equivalent on laptop trackpad)
    if (e.touches.length === 2) {
      setShowDeleteFor(notificationId);
      return;
    }

    longPressTimerRef.current = setTimeout(() => {
      setShowDeleteFor(notificationId);
    }, 500); // 500ms long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel long press if user moves finger too much
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    touchStartRef.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent, notificationId: string) => {
    e.preventDefault();
    setShowDeleteFor(notificationId);
  };

  const handleDeleteNotification = async (notification: PaymentNotification) => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    try {
      const res = await fetch("/api/notifications/payment/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: notification._id,
          myProfileId: user.profileId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Remove from UI
        setPaymentNotifications((prev) => 
          prev.filter((n) => n._id !== notification._id)
        );
        setShowDeleteFor(null);
        console.log("✅ Payment notification deleted");
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete notification");
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

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes < 1) return `${seconds}s left`;
    if (minutes === 1) return `1m ${seconds}s left`;
    return `${minutes}m ${seconds}s left`;
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

  const totalNotifications = connectionRequests.length + paymentNotifications.length;

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
              <h1 className="text-xl font-bold">Notifications</h1>
              {totalNotifications > 0 && (
                <span className="ml-auto bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {totalNotifications}
                </span>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="p-4 space-y-3">
            {totalNotifications === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No notifications</p>
                <button
                  onClick={() => router.push("/")}
                  className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                >
                  Discover Profiles
                </button>
              </div>
            ) : (
              <>
                {/* Payment Notifications */}
                {paymentNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    onTouchStart={(e) => handleTouchStart(e, notification._id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onContextMenu={(e) => handleContextMenu(e, notification._id)}
                    className="bg-gradient-to-r from-green-50 to-white rounded-xl shadow-sm p-4 border-2 border-green-200 hover:shadow-md transition-shadow relative"
                  >
                    <div className="flex items-start gap-4">
                      {/* Profile Image */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTierColor(
                            notification.tier
                          )} p-[3px]`}
                        >
                          <div
                            className="w-full h-full rounded-full bg-cover bg-center bg-gray-200"
                            style={{
                              backgroundImage: `url(${
                                notification.fromImageUrl || "/placeholder.jpg"
                              })`,
                            }}
                          />
                        </div>
                        {/* Green checkmark badge */}
                        <div className="relative -mt-5 ml-10">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                            <FaCheck size={12} className="text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-green-700 text-sm mb-1">
                          Payment Required
                        </p>
                        <p className="font-semibold text-gray-900 truncate">
                          {notification.fromName} accepted your request! 🎉
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Complete payment to start chatting
                        </p>
                        
                        {/* Expiry Timer */}
                        <div className="flex items-center gap-2 mt-2">
                          <FaClock size={12} className="text-orange-500" />
                          <span className="text-xs font-medium text-orange-600">
                            {getTimeRemaining(notification.expiresAt)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">
                            {getTimeAgo(notification.createdAt)}
                          </span>
                        </div>

                        {/* Pay Now Button */}
                        <button
                          onClick={() => handlePayNow(notification)}
                          className="mt-3 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-bold py-2.5 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-2"
                        >
                          <FaMoneyBillWave size={16} />
                          Pay Now
                        </button>
                      </div>
                    </div>

                    {/* Delete Button Overlay */}
                    {showDeleteFor === notification._id && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowDeleteFor(null)}
                        />
                        
                        {/* Delete Button */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                          <button
                            onClick={() => handleDeleteNotification(notification)}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 font-semibold transition-all hover:scale-110 active:scale-95"
                          >
                            <FaTrash size={18} />
                            Delete Notification
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Connection Requests */}
                {connectionRequests.map((request) => (
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
                        className="cursor-pointer flex-shrink-0"
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
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            handleConnectionRespond(request._id, "rejected")
                          }
                          disabled={processingId === request._id}
                          className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                          <FaTimes size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleConnectionRespond(
                              request._id,
                              "accepted",
                              request.fromProfileId._id
                            )
                          }
                          disabled={processingId === request._id}
                          className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                          <FaCheck size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  );
}