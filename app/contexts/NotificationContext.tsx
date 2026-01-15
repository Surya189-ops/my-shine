// app/contexts/NotificationContext.tsx - NEW FILE
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface NotificationContextType {
  hasUnread: boolean;
  setHasUnread: (value: boolean) => void;
  markAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  hasUnread: false,
  setHasUnread: () => {},
  markAsRead: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [hasUnread, setHasUnread] = useState(false);

  // Check for existing unread notifications on mount
  useEffect(() => {
    checkUnreadNotifications();
  }, []);

  const checkUnreadNotifications = async () => {
    try {
      const userStr = localStorage.getItem("myshine_user");
      if (!userStr) return;

      const user = JSON.parse(userStr);
      if (!user.profileId) return;

      const res = await fetch(`/api/notifications/count?profileId=${user.profileId}`);
      const data = await res.json();

      if (data.success && data.count > 0) {
        setHasUnread(true);
      }
    } catch (err) {
      console.error("Failed to check unread notifications:", err);
    }
  };

  const markAsRead = () => {
    setHasUnread(false);
  };

  return (
    <NotificationContext.Provider value={{ hasUnread, setHasUnread, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}