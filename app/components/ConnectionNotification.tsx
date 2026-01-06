"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";

export default function ConnectionNotification() {
  const [request, setRequest] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    fetch(`/api/connections/incoming?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.requests.length > 0) {
          setRequest(data.requests[0]);
          setVisible(true);

          // ⏱ auto hide after 5 sec
          setTimeout(() => setVisible(false), 5000);
        }
      });
  }, []);

  const respond = async (action: "accepted" | "rejected") => {
    await fetch("/api/connections/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: request._id,
        action,
      }),
    });

    setVisible(false);
  };

  if (!visible || !request) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-white shadow-md px-4 py-3 flex items-center justify-between">
      <p className="text-sm font-medium">
        {request.fromUserId.name} wants to connect
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => respond("accepted")}
          className="bg-green-500 text-white p-2 rounded"
        >
          <FiCheck />
        </button>

        <button
          onClick={() => respond("rejected")}
          className="bg-red-500 text-white p-2 rounded"
        >
          <FiX />
        </button>
      </div>
    </div>
  );
}
