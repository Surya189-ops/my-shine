"use client";

import { useEffect, useState } from "react";

export default function NotificationsPage() {
  const [requests, setRequests] = useState<any[]>([]);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("myshine_user") || "{}")
      : null;

  useEffect(() => {
    if (!user?.profileId) return;

    fetch(`/api/connections/incoming?profileId=${user.profileId}`)
      .then(res => res.json())
      .then(data => setRequests(data.requests || []));
  }, []);

  const respond = async (id: string, action: string) => {
    await fetch("/api/connections/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, action }),
    });

    setRequests(prev => prev.filter(r => r._id !== id));
  };

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-4">Connection Requests</h1>

      {requests.length === 0 && <p>No requests</p>}

      {requests.map(req => (
        <div
          key={req._id}
          className="bg-white p-3 rounded mb-3 shadow"
        >
          <p className="mb-2">
            {req.fromUserId?.name || "Someone"} wants to connect
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => respond(req._id, "accepted")}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Accept
            </button>
            <button
              onClick={() => respond(req._id, "rejected")}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
