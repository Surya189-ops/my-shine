"use client";

import { useEffect, useState } from "react";
import ConnectionNotification from "./ConnectionNotification";

export default function NotificationWrapper() {
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("myshine_profile");
    if (stored) {
      const profile = JSON.parse(stored);
      if (profile?._id) {
        setProfileId(profile._id);
      }
    }
  }, []);

  if (!profileId) return null;

  return <ConnectionNotification profileId={profileId} />;
}
