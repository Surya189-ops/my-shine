// lib/initSocket.ts
export async function initSocket() {
  try {
    // This triggers the socket server to initialize
    await fetch("/api/socket");
    console.log("✅ Socket server initialized");
  } catch (err) {
    console.error("❌ Failed to initialize socket:", err);
  }
}