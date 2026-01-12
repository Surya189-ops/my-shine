// app/components/SocketInitializer.tsx
"use client";

import { useEffect } from "react";

export default function SocketInitializer() {
  useEffect(() => {
    // Initialize socket server on app load
    const initSocket = async () => {
      try {
        await fetch("/api/socket");
        console.log("✅ Socket server initialized from SocketInitializer");
      } catch (err) {
        console.error("❌ Socket initialization error:", err);
      }
    };

    initSocket();
  }, []);

  return null; // This component doesn't render anything
}