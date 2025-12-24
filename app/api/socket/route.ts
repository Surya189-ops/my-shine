import { Server } from "socket.io";
import { NextResponse } from "next/server";

let io: Server | null = null;

export async function GET() {
  if (!io) {
    // @ts-ignore
    const server = global._socketServer;

    if (!server) {
      return NextResponse.json(
        { success: false, message: "Server not ready" },
        { status: 500 }
      );
    }

    io = new Server(server, {
      path: "/api/socket",
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      socket.on("user-online", (userId) => {
        socket.broadcast.emit("user-online", userId);
      });

      socket.on("user-offline", (userId) => {
        socket.broadcast.emit("user-offline", {
          userId,
          lastSeen: Date.now(),
        });
      });

      console.log("🟢 Socket connected:", socket.id);

      socket.on("join-room", (roomId) => {
        socket.join(roomId);
      });

      socket.on("send-message", (data) => {
        socket.to(data.roomId).emit("receive-message", data);
      });

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });

    // @ts-ignore
    global._io = io;
  }

  return NextResponse.json({ success: true });
}
