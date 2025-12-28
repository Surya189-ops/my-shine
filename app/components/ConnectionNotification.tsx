"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";

type Request = {
  _id: string;
  fromUserId: { name?: string };
};

export default function ConnectionNotification({
  profileId,
}: {
  profileId: string;
}) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch(`/api/connections/pending?profileId=${profileId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.requests.length > 0) {
          setRequests(data.requests);
          setVisible(true);

          // auto hide after 5 seconds
          setTimeout(() => setVisible(false), 5000);
        }
      });
  }, [profileId]);

  const respond = async (requestId: string, action: "accepted" | "rejected") => {
    await fetch("/api/connections/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });

    setRequests((prev) => prev.filter((r) => r._id !== requestId));
  };

  if (!visible || requests.length === 0) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md bg-white shadow-lg rounded-lg p-3 flex items-center justify-between animate-slide-down">
      <p className="text-sm font-medium">
        {requests[0].fromUserId?.name || "Someone"} wants to connect
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => respond(requests[0]._id, "accepted")}
          className="bg-green-500 text-white p-2 rounded-full"
        >
          <FiCheck size={16} />
        </button>

        <button
          onClick={() => respond(requests[0]._id, "rejected")}
          className="bg-red-500 text-white p-2 rounded-full"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
}
