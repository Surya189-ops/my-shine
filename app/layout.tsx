// app/layout.tsx
import "./globals.css";
import SocketInitializer from "./components/SocketInitializer";
import NotificationWrapper from "./components/NotificationWrapper";
import ProfileIdFixer from "./components/ProfileIdFixer";

export const metadata = {
  title: "My Shine",
  description: "Talk & Connect",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ec4899" />

        {/* iOS support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="My Shine" />
      </head>

      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* 🚀 INITIALIZE SOCKET SERVER FIRST */}
        <SocketInitializer />

        {/* 🔧 FIX MISSING PROFILEID FOR EXISTING USERS */}
        <ProfileIdFixer />

        {/* 🔔 GLOBAL CONNECTION NOTIFICATIONS */}
        <NotificationWrapper />

        {/* APP CONTENT */}
        {children}
      </body>
    </html>
  );
}