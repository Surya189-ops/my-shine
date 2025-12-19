"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
};

const notifications: Notification[] = [
  {
    id: 1,
    title: "Booking Confirmed",
    message: "Your session with Sam Oppa Tour is confirmed.",
    time: "2 mins ago",
    unread: true,
  },
  {
    id: 2,
    title: "New Profiles Available",
    message: "New Gold tier profiles are now available.",
    time: "1 hr ago",
    unread: true,
  },
  {
    id: 3,
    title: "Verification Successful",
    message: "Your profile has been verified successfully.",
    time: "Yesterday",
  },
  {
    id: 4,
    title: "Reminder",
    message: "Your session starts in 30 minutes.",
    time: "Yesterday",
  },
];

export default function NotificationsPage() {
  const router = useRouter();

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    const user = localStorage.getItem("myshine_user");
    if (!user) {
      router.replace("/login");
      return;
    }

    try {
      const parsed = JSON.parse(user);
      if (!parsed.loggedIn) {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800 px-4 pb-28">

        {/* HEADER */}
        <div className="pt-6 text-center">
          <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-100">
            Notifications
          </h1>
        </div>

        {/* LIST */}
        <div className="mt-6 max-w-md mx-auto space-y-4">
          {notifications.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="
                  relative p-4 rounded-xl
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  shadow-sm
                  transition
                "
              >
                {/* UNREAD DOT */}
                {n.unread && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-pink-500 rounded-full" />
                )}

                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-100">
                  {n.title}
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {n.message}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  {n.time}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
