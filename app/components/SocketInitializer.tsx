// app/components/SocketInitializer.tsx
"use client";

import { useEffect } from "react";

export default function SocketInitializer() {
  useEffect(() => {
    // Initialize socket server immediately on app load
    const initSocket = async () => {
      try {
        await fetch("/api/socket");
        console.log("🚀 Socket server initialized on app load");
      } catch (err) {
        console.error("❌ Failed to initialize socket server:", err);
      }
    };

    initSocket();
  }, []);

  return null; // This component renders nothing
}