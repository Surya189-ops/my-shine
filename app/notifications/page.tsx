// app/notifications/page.tsx - Updated with Badge Hide Functionality
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { FiClock, FiX, FiCheck, FiTrash2 } from "react-icons/fi";

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
  createdAt: string;
  expiresAt: string;
  status: string;
}

interface ConnectionNotification {
  _id: string;
  fromProfile: {
    _id: string;
    name: string;
    imageUrl?: string;
    age: number;
    gender: string;
    tier: string;
  };
  requestId: string;
  createdAt: string;
  expiresAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [paymentNotifications, setPaymentNotifications] = useState<PaymentNotification[]>([]);
  const [connectionNotifications, setConnectionNotifications] = useState<ConnectionNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [longPressId, setLongPressId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(userStr);
    if (!userData.profileId) {
      router.push("/profile");
      return;
    }

    setMyProfileId(userData.profileId);
    
    // Mark all notifications as seen when page opens
    markNotificationsAsSeen(userData.profileId);
    
    // Initial fetch
    fetchNotifications(userData.profileId);

    // Auto-refresh every 30 seconds to check for expired notifications
    const interval = setInterval(() => {
      fetchNotifications(userData.profileId);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [router]);

  // Listen for refresh events from toasts
  useEffect(() => {
    const handleRefresh = () => {
      if (myProfileId) {
        fetchNotifications(myProfileId);
      }
    };

    window.addEventListener("refreshNotificationBadge", handleRefresh);
    return () => window.removeEventListener("refreshNotificationBadge", handleRefresh);
  }, [myProfileId]);

  const markNotificationsAsSeen = async (profileId: string) => {
    try {
      await fetch("/api/notifications/mark-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      console.log("✅ Notifications marked as seen");
      
      // Trigger badge refresh to hide red dot
      window.dispatchEvent(new Event("refreshNotificationBadge"));
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
    }
  };

  const fetchNotifications = async (profileId: string) => {
    try {
      setLoading(true);

      // Fetch payment notifications
      const paymentRes = await fetch(`/api/notifications/payment?profileId=${profileId}`);
      const paymentData = await paymentRes.json();

      // Fetch connection notifications
      const connectionRes = await fetch(`/api/notifications/connection?profileId=${profileId}`);
      const connectionData = await connectionRes.json();

      setPaymentNotifications(paymentData.notifications || []);
      setConnectionNotifications(connectionData.notifications || []);

      console.log(`📊 Loaded: ${paymentData.notifications?.length || 0} payment, ${connectionData.notifications?.length || 0} connection`);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (notification: PaymentNotification) => {
    try {
      // Delete the notification first
      await fetch(`/api/notifications/payment?notificationId=${notification._id}`, {
        method: "DELETE",
      });
      
      console.log("🚀 Redirecting to payment page...");
      
      // Trigger badge refresh
      window.dispatchEvent(new Event("refreshNotificationBadge"));
      
      // Navigate to payment page
      const fromProfileId = notification.fromProfileId?._id || notification.fromProfileId;
      router.push(`/payment?profileId=${fromProfileId}&requestId=${notification.requestId}`);
    } catch (error) {
      console.error("Error during payment navigation:", error);
      
      // Still try to navigate even if delete fails
      const fromProfileId = notification.fromProfileId?._id || notification.fromProfileId;
      router.push(`/payment?profileId=${fromProfileId}&requestId=${notification.requestId}`);
    }
  };

  const handleDeletePayment = async (notification: PaymentNotification) => {
    try {
      // First, send payment declined notification to the other user
      await fetch("/api/notifications/payment/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromProfileId: notification.fromProfileId._id,
          requestId: notification.requestId,
        }),
      });

      // Then delete the notification
      await fetch(`/api/notifications/payment?notificationId=${notification._id}`, {
        method: "DELETE",
      });

      setPaymentNotifications((prev) => prev.filter((n) => n._id !== notification._id));
      setLongPressId(null);
      window.dispatchEvent(new Event("refreshNotificationBadge"));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleAcceptConnection = async (requestId: string, fromProfileId: string) => {
    try {
      const response = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "accepted",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from list
        setConnectionNotifications((prev) => prev.filter((n) => n.requestId !== requestId));
        window.dispatchEvent(new Event("refreshNotificationBadge"));
        
        // Redirect to chat page
        router.push(`/chat/${fromProfileId}`);
      } else {
        alert(data.message || "Failed to accept connection");
      }
    } catch (error) {
      console.error("Error accepting connection:", error);
      alert("Something went wrong");
    }
  };

  const handleRejectConnection = async (requestId: string) => {
    try {
      const response = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "rejected",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from list
        setConnectionNotifications((prev) => prev.filter((n) => n.requestId !== requestId));
        window.dispatchEvent(new Event("refreshNotificationBadge"));
      } else {
        alert(data.message || "Failed to reject connection");
      }
    } catch (error) {
      console.error("Error rejecting connection:", error);
      alert("Something went wrong");
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold": return "from-yellow-400 via-yellow-500 to-amber-500";
      case "silver": return "from-gray-300 via-gray-400 to-gray-500";
      case "bronze": return "from-orange-400 via-amber-600 to-orange-700";
      default: return "from-gray-400 to-gray-500";
    }
  };

  const getTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Two-finger tap / right-click handlers for payment notifications
  const handleContextMenu = (e: React.MouseEvent, notificationId: string) => {
    e.preventDefault(); // Prevent default context menu
    setLongPressId(longPressId === notificationId ? null : notificationId);
  };

  const handleTwoFingerTap = (e: React.TouchEvent, notificationId: string) => {
    // Detect two-finger tap
    if (e.touches.length === 2) {
      e.preventDefault();
      setLongPressId(longPressId === notificationId ? null : notificationId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const totalNotifications = paymentNotifications.length + connectionNotifications.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
              {totalNotifications > 0 && (
                <p className="text-xs text-gray-500">{totalNotifications} pending</p>
              )}
            </div>
          </div>
          {totalNotifications > 0 && (
            <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{totalNotifications}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {/* Payment Notifications */}
        {paymentNotifications.map((notification) => (
          <div
            key={notification._id}
            className="relative"
            onContextMenu={(e) => handleContextMenu(e, notification._id)}
            onTouchStart={(e) => handleTwoFingerTap(e, notification._id)}
          >
            {/* Delete Button Badge */}
            {longPressId === notification._id && (
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center z-20 animate-fadeIn">
                <button
                  onClick={() => handleDeletePayment(notification)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transform hover:scale-105 transition-all"
                >
                  <FiTrash2 size={20} />
                  Delete Notification
                </button>
              </div>
            )}

            {/* Main Notification Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="h-1 bg-gray-100">
                <div className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500"></div>
              </div>

              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTierColor(notification.tier)} p-[3px] shadow-lg`}>
                      <div className="w-full h-full rounded-full bg-white p-[2px]">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                          {notification.fromImageUrl || notification.fromProfileId?.imageUrl ? (
                            <img
                              src={notification.fromImageUrl || notification.fromProfileId.imageUrl}
                              alt={notification.fromName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      <FiCheck className="text-white" size={14} strokeWidth={3} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment Required</p>
                    <p className="text-base font-bold text-gray-900 mb-1">{notification.fromName} accepted your request! 🎉</p>
                    <p className="text-sm text-gray-600">Complete payment to start chatting</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="flex items-center gap-1.5 text-red-500">
                    <FiClock size={16} />
                    <p className="text-sm font-semibold">Expires in: {getTimeLeft(notification.expiresAt)}</p>
                  </div>
                </div>

                <button
                  onClick={() => handlePayNow(notification)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  💳 Pay Now
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Connection Request Notifications */}
        {connectionNotifications.map((notification) => (
          <div key={notification._id} className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-400 opacity-10 animate-pulse"></div>
            
            <div className="h-1.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200">
              <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-lg animate-pulse"></div>
            </div>

            <div className="relative p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg animate-pulse opacity-50"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full blur-md animate-pulse opacity-30"></div>
                  
                  <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 overflow-hidden border-2 border-white shadow-xl ring-2 ring-blue-200">
                    {notification.fromProfile.imageUrl ? (
                      <img src={notification.fromProfile.imageUrl} alt={notification.fromProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {notification.fromProfile.gender === "male" ? "👨" : "👩"}
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold bg-gradient-to-r from-gray-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent truncate mb-0.5">
                    {notification.fromProfile.name} wants to connect
                  </p>
                  <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                    <span>{notification.fromProfile.age} • {notification.fromProfile.gender}</span>
                    <span className="text-blue-600 font-semibold inline-flex items-center gap-1">
                      <FiClock size={12} />
                      {getTimeLeft(notification.expiresAt)}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2.5 flex-shrink-0">
                  <button
                    onClick={() => handleRejectConnection(notification.requestId)}
                    className="relative w-11 h-11 bg-gradient-to-br from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:via-rose-600 hover:to-red-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-2xl hover:shadow-red-500/50 hover:scale-110 active:scale-95 group ring-2 ring-red-200"
                  >
                    <div className="absolute inset-0 bg-red-400 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity"></div>
                    <FiX className="relative text-white drop-shadow-lg" size={22} strokeWidth={3} />
                  </button>

                  <button
                    onClick={() => handleAcceptConnection(notification.requestId, notification.fromProfile._id)}
                    className="relative w-11 h-11 bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-2xl hover:shadow-green-500/50 hover:scale-110 active:scale-95 group ring-2 ring-green-200"
                  >
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity"></div>
                    <FiCheck className="relative text-white drop-shadow-lg" size={22} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
          </div>
        ))}

        {/* Empty State */}
        {totalNotifications === 0 && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">🔔</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">All Clear!</h3>
            <p className="text-gray-600">You have no pending notifications</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}