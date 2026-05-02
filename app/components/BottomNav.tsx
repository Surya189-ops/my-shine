"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiFillHome } from "react-icons/ai";
import { FiSearch, FiUser } from "react-icons/fi";
import { IoNotificationsOutline } from "react-icons/io5";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setProfileId(user.profileId);
    }
  }, []);

  useEffect(() => {
    if (!profileId) return;
    fetchUnreadCount();
    const handleRefresh = () => fetchUnreadCount();
    window.addEventListener("refreshNotificationBadge", handleRefresh);
    return () => window.removeEventListener("refreshNotificationBadge", handleRefresh);
  }, [profileId, pathname]);

  const fetchUnreadCount = async () => {
    if (!profileId) return;
    try {
      const res = await fetch(`/api/notifications/unread-count?profileId=${profileId}`);
      const data = await res.json();
      if (data.success) setHasUnread(data.unreadCount > 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const navItems = [
    { icon: <AiFillHome size={24} />, path: "/home" },
    { icon: <FiSearch size={24} />, path: "/search" },
    {
      icon: <IoNotificationsOutline size={24} />,
      path: "/notifications",
      showBadge: true,
    },
    { icon: <FiUser size={24} />, path: "/profile" },
  ];

  // Consider /home as active for the home icon
  const isHomePath = pathname === "/home" || pathname === "/";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="mx-auto max-w-md md:max-w-xl">
        <div className="flex justify-between items-center px-8 h-14">
          {navItems.map((item, index) => {
            const isActive =
              item.path === "/home"
                ? isHomePath
                : pathname === item.path;

            return (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "text-pink-500 scale-110"
                    : "text-gray-400 dark:text-gray-500 hover:text-pink-400"
                }`}
              >
                {item.icon}
                {item.showBadge && hasUnread && pathname !== "/notifications" && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}