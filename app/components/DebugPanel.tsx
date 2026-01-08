// app/components/DebugPanel.tsx
"use client";

import { useState, useEffect } from "react";

export default function DebugPanel() {
  const [show, setShow] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [socketStatus, setSocketStatus] = useState("Not checked");

  useEffect(() => {
    const user = localStorage.getItem("myshine_user");
    if (user) {
      const parsed = JSON.parse(user);
      setProfileId(parsed.profileId || "No profileId");
    }
  }, []);

  const resetConnections = async () => {
    const user = JSON.parse(localStorage.getItem("myshine_user") || "{}");
    if (!user.profileId) {
      alert("No profileId found");
      return;
    }

    const confirm = window.confirm(
      "This will delete all your connection requests. Continue?"
    );
    if (!confirm) return;

    try {
      const res = await fetch("/api/connections/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: user.profileId }),
      });

      const data = await res.json();
      alert(data.message);
      window.location.reload();
    } catch (err) {
      alert("Failed to reset");
    }
  };

  const checkSocket = () => {
    const hasGlobalIo = typeof (global as any).io !== "undefined";
    setSocketStatus(
      hasGlobalIo ? "✅ Socket server running" : "❌ Socket not initialized"
    );
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-24 right-4 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg z-50 flex items-center justify-center text-xl"
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 w-80 bg-white border-2 border-blue-500 rounded-lg shadow-xl z-50 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-blue-600">🐛 Debug Panel</h3>
        <button
          onClick={() => setShow(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="p-2 bg-gray-50 rounded">
          <p className="font-semibold">ProfileId:</p>
          <p className="text-xs break-all">{profileId}</p>
        </div>

        <div className="p-2 bg-gray-50 rounded">
          <p className="font-semibold">Socket Status:</p>
          <p className="text-xs">{socketStatus}</p>
          <button
            onClick={checkSocket}
            className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Check Socket
          </button>
        </div>

        <button
          onClick={resetConnections}
          className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          🗑️ Reset All Connections
        </button>

        <button
          onClick={() => {
            console.log("Current localStorage:", localStorage.getItem("myshine_user"));
            alert("Check console for localStorage data");
          }}
          className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          📋 Log LocalStorage
        </button>
      </div>
    </div>
  );
}