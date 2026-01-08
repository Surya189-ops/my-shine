// pages/api/socket.ts
import { Server } from "socket.io";
import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "@/types/socket";

export default function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (res.socket.server.io) {
    console.log("✅ Socket already running");
    global.io = res.socket.server.io; // ✅ Ensure global is always set
    res.end();
    return;
  }

  console.log("🚀 Initializing new Socket.IO server...");
  
  const io = new Server(res.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  res.socket.server.io = io;
  global.io = io; // ✅ Store globally for API routes
  
  console.log("✅ Socket.IO server created and stored globally");
  console.log("✅ global.io is now:", !!global.io);

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    // ============ USER ROOM MANAGEMENT ============
    // Join user's personal room for receiving notifications
    socket.on("join-user-room", (profileId: string) => {
      socket.join(`user:${profileId}`);
      console.log(`👤 Socket ${socket.id} joined user room: user:${profileId}`);
    });

    // Leave user's personal room
    socket.on("leave-user-room", (profileId: string) => {
      socket.leave(`user:${profileId}`);
      console.log(`👋 Socket ${socket.id} left user room: user:${profileId}`);
    });

    // ============ CHAT ROOM MANAGEMENT ============
    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      console.log(`👥 Socket ${socket.id} joined chat room: ${roomId}`);
    });

    // ============ CHAT MESSAGES ============
    socket.on("send-message", (data: any) => {
      console.log("📤 Broadcasting message to room:", data.roomId);
      socket.to(data.roomId).emit("receive-message", data);
    });

    // ============ MESSAGE STATUS ============
    socket.on("message-delivered", (data: { roomId: string; messageId: string }) => {
      console.log("📬 Message delivered:", data.messageId);
      socket.to(data.roomId).emit("message-status-update", {
        messageId: data.messageId,
        delivered: true,
      });
    });

    socket.on("messages-read", (data: { roomId: string; messageIds: string[] }) => {
      console.log("👁️ Messages read:", data.messageIds);
      socket.to(data.roomId).emit("messages-status-update", {
        messageIds: data.messageIds,
        read: true,
      });
    });

    // ============ CONNECTION REQUESTS ============
    // Notify user of new connection request (direct emit from API)
    // No listener needed here - API emits directly to room

    // Notify sender of response (accepted/rejected)
    socket.on("connection-response-sent", (data: {
      toProfileId: string; // original sender
      fromProfileId: string; // person who responded
      fromName: string;
      action: "accepted" | "rejected";
      requestId: string;
    }) => {
      console.log(`✅ Sending connection response (${data.action}) to:`, data.toProfileId);
      io.to(`user:${data.toProfileId}`).emit("connection-response-received", {
        fromProfileId: data.fromProfileId,
        fromName: data.fromName,
        action: data.action,
        requestId: data.requestId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  console.log("🚀 Socket server initialized");
  res.end();
}