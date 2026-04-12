"use client";

import { SessionProvider } from "next-auth/react";
import { DarkModeProvider } from "@/app/contexts/DarkModeContext";

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DarkModeProvider>
        {children}
      </DarkModeProvider>
    </SessionProvider>
  );
}