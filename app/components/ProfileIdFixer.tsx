// app/components/ProfileIdFixer.tsx
"use client";

import { useEffect } from "react";

/**
 * This component automatically fixes missing profileId in localStorage
 * for users who logged in before the fix was implemented.
 * 
 * Add this to your layout.tsx to run on every page load.
 */
export default function ProfileIdFixer() {
  useEffect(() => {
    const fixProfileId = async () => {
      try {
        const userStr = localStorage.getItem("myshine_user");
        if (!userStr) return;

        const user = JSON.parse(userStr);
        
        // Only run if user is logged in but missing profileId
        if (user.loggedIn && user.id && !user.profileId) {
          console.log("🔧 Fixing missing profileId for user:", user.id);
          
          const res = await fetch(`/api/profile?userId=${user.id}`);
          const data = await res.json();
          
          if (data.success && data.profile) {
            const updatedUser = {
              ...user,
              profileId: data.profile._id,
              name: data.profile.name,
            };
            localStorage.setItem("myshine_user", JSON.stringify(updatedUser));
            console.log("✅ ProfileId fixed:", data.profile._id);
          } else {
            console.log("⚠️ No profile found for user, needs to create profile");
          }
        }
      } catch (err) {
        console.error("❌ Error fixing profileId:", err);
      }
    };

    fixProfileId();
  }, []);

  return null; // This component renders nothing
}