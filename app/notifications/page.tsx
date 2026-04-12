"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { FiClock, FiX, FiCheck, FiTrash2 } from "react-icons/fi";

interface PaymentNotification {
  _id: string;
  fromProfileId: { _id: string; name: string; imageUrl?: string; tier: string; };
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
  fromProfile: { _id: string; name: string; imageUrl?: string; age: number; gender: string; tier: string; };
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
    if (!userStr) { router.push("/login"); return; }
    const userData = JSON.parse(userStr);
    if (!userData.profileId) { router.push("/profile"); return; }
    setMyProfileId(userData.profileId);
    markNotificationsAsSeen(userData.profileId);
    fetchNotifications(userData.profileId);
    const interval = setInterval(() => fetchNotifications(userData.profileId), 30000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    const handleRefresh = () => { if (myProfileId) fetchNotifications(myProfileId); };
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
      window.dispatchEvent(new Event("refreshNotificationBadge"));
    } catch (error) { console.error("Error marking seen:", error); }
  };

  const fetchNotifications = async (profileId: string) => {
    try {
      setLoading(true);
      const [paymentRes, connectionRes] = await Promise.all([
        fetch(`/api/notifications/payment?profileId=${profileId}`),
        fetch(`/api/notifications/connection?profileId=${profileId}`),
      ]);
      const paymentData = await paymentRes.json();
      const connectionData = await connectionRes.json();
      setPaymentNotifications(paymentData.notifications || []);
      setConnectionNotifications(connectionData.notifications || []);
    } catch (error) { console.error("Error fetching notifications:", error); }
    finally { setLoading(false); }
  };

  const handlePayNow = async (notification: PaymentNotification) => {
    try {
      await fetch(`/api/notifications/payment?notificationId=${notification._id}`, { method: "DELETE" });
      window.dispatchEvent(new Event("refreshNotificationBadge"));
      const fromProfileId = notification.fromProfileId?._id || notification.fromProfileId;
      router.push(`/payment?profileId=${fromProfileId}&requestId=${notification.requestId}`);
    } catch {
      const fromProfileId = notification.fromProfileId?._id || notification.fromProfileId;
      router.push(`/payment?profileId=${fromProfileId}&requestId=${notification.requestId}`);
    }
  };

  const handleDeletePayment = async (notification: PaymentNotification) => {
    try {
      await fetch("/api/notifications/payment/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromProfileId: notification.fromProfileId._id, requestId: notification.requestId }),
      });
      await fetch(`/api/notifications/payment?notificationId=${notification._id}`, { method: "DELETE" });
      setPaymentNotifications((prev) => prev.filter((n) => n._id !== notification._id));
      setLongPressId(null);
      window.dispatchEvent(new Event("refreshNotificationBadge"));
    } catch (error) { console.error("Error deleting notification:", error); }
  };

  const handleAcceptConnection = async (requestId: string, fromProfileId: string) => {
    try {
      const response = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "accepted" }),
      });
      const data = await response.json();
      if (data.success) {
        setConnectionNotifications((prev) => prev.filter((n) => n.requestId !== requestId));
        window.dispatchEvent(new Event("refreshNotificationBadge"));
        router.push(`/chat/${fromProfileId}`);
      } else alert(data.message || "Failed to accept");
    } catch { alert("Something went wrong"); }
  };

  const handleRejectConnection = async (requestId: string) => {
    try {
      const response = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "rejected" }),
      });
      const data = await response.json();
      if (data.success) {
        setConnectionNotifications((prev) => prev.filter((n) => n.requestId !== requestId));
        window.dispatchEvent(new Event("refreshNotificationBadge"));
      } else alert(data.message || "Failed to reject");
    } catch { alert("Something went wrong"); }
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
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setLongPressId(longPressId === id ? null : id);
  };

  const handleTwoFingerTap = (e: React.TouchEvent, id: string) => {
    if (e.touches.length === 2) { e.preventDefault(); setLongPressId(longPressId === id ? null : id); }
  };

  const totalNotifications = paymentNotifications.length + connectionNotifications.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 dark:bg-gray-900 flex items-center justify-center pb-20 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-900 pb-20 transition-colors duration-300">

      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Notifications</h1>
              {totalNotifications > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{totalNotifications} pending</p>
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

      {/* NOTIFICATIONS */}
      <div className="max-w-2xl mx-auto p-4 space-y-3">

        {/* PAYMENT NOTIFICATIONS */}
        {paymentNotifications.map((notification) => (
          <div
            key={notification._id}
            className="relative"
            onContextMenu={(e) => handleContextMenu(e, notification._id)}
            onTouchStart={(e) => handleTwoFingerTap(e, notification._id)}
          >
            {longPressId === notification._id && (
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center z-20">
                <button
                  onClick={() => handleDeletePayment(notification)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
                >
                  <FiTrash2 size={20} />
                  Delete Notification
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-300">
              <div className="h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTierColor(notification.tier)} p-[3px] shadow-lg`}>
                      <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-[2px]">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
                          {notification.fromImageUrl || notification.fromProfileId?.imageUrl ? (
                            <img src={notification.fromImageUrl || notification.fromProfileId.imageUrl} alt={notification.fromName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-md">
                      <FiCheck className="text-white" size={14} strokeWidth={3} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Payment Required</p>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">{notification.fromName} accepted your request! 🎉</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Complete payment to start chatting</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 px-1">
                  <FiClock size={16} className="text-red-500" />
                  <p className="text-sm font-semibold text-red-500">Expires in: {getTimeLeft(notification.expiresAt)}</p>
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

        {/* CONNECTION NOTIFICATIONS */}
        {connectionNotifications.map((notification) => (
          <div key={notification._id} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <div className="relative p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 overflow-hidden border-2 border-white dark:border-gray-700 shadow-xl ring-2 ring-blue-200 dark:ring-blue-700">
                    {notification.fromProfile.imageUrl ? (
                      <img src={notification.fromProfile.imageUrl} alt={notification.fromProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {notification.fromProfile.gender === "male" ? "👨" : "👩"}
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg animate-bounce">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-800 dark:text-gray-100 truncate mb-0.5">
                    {notification.fromProfile.name} wants to connect
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
                    <span>{notification.fromProfile.age} • {notification.fromProfile.gender}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold inline-flex items-center gap-1">
                      <FiClock size={12} />
                      {getTimeLeft(notification.expiresAt)}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2.5 flex-shrink-0">
                  <button
                    onClick={() => handleRejectConnection(notification.requestId)}
                    className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 ring-2 ring-red-200 dark:ring-red-800"
                  >
                    <FiX className="text-white" size={22} strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => handleAcceptConnection(notification.requestId, notification.fromProfile._id)}
                    className="w-11 h-11 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 ring-2 ring-green-200 dark:ring-green-800"
                  >
                    <FiCheck className="text-white" size={22} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* EMPTY STATE */}
        {totalNotifications === 0 && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">🔔</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">All Clear!</h3>
            <p className="text-gray-600 dark:text-gray-400">You have no pending notifications</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}