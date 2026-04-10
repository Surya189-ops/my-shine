// pages/api/socket.ts - UPDATED with Video Call Signaling
import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIo } from "@/types/socket";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (!res.socket.server.io) {
    console.log("🚀 Initializing Socket.io server...");

    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    global.io = io;

    io.on("connection", (socket) => {
      console.log("✅ Client connected:", socket.id);

      /* -------- CHAT ROOM -------- */
      socket.on("join-room", (roomId: string) => {
        socket.join(roomId);
        console.log(`📥 User ${socket.id} joined room: ${roomId}`);
      });

      /* -------- USER ROOM (for notifications) -------- */
      socket.on("join-user-room", (userRoom: string) => {
        socket.join(userRoom);
        console.log(`👤 User ${socket.id} joined user room: ${userRoom}`);
      });

      /* -------- SEND MESSAGE -------- */
      socket.on("send-message", (data: any) => {
        console.log("📨 Broadcasting message to room:", data.roomId);
        socket.to(data.roomId).emit("receive-message", data);

        const receiverRoom = `user:${data.receiverProfileId}`;
        console.log("📬 Notifying receiver about new message:", receiverRoom);
        io.to(receiverRoom).emit("new-message-notification", {
          from: data.senderProfileId,
          messageId: data._id,
        });
      });

      /* -------- EDIT MESSAGE -------- */
      socket.on("edit-message", (data: any) => {
        console.log("✏️ Broadcasting message edit to room:", data.roomId);
        socket.to(data.roomId).emit("message-edited", {
          messageId: data.messageId,
          newText: data.newText,
          isEdited: data.isEdited,
          editedAt: data.editedAt,
        });
      });

      /* -------- DELETE MESSAGE -------- */
      socket.on("delete-message", (data: any) => {
        console.log("🗑️ Broadcasting message delete to room:", data.roomId);
        socket.to(data.roomId).emit("message-deleted", {
          messageId: data.messageId,
          isDeleted: data.isDeleted,
          deletedForEveryone: data.deletedForEveryone,
        });
      });

      /* -------- VIEW-ONCE VIEWED -------- */
      socket.on("view-once-viewed", (data: any) => {
        console.log("👁️ Broadcasting view-once viewed to room:", data.roomId);
        socket.to(data.roomId).emit("view-once-viewed", {
          messageId: data.messageId,
          viewedBy: data.viewedBy,
          viewedAt: data.viewedAt,
        });
      });

      /* -------- TYPING INDICATORS -------- */
      socket.on("typing-start", (data: any) => {
        console.log("⌨️ User typing start:", data);
        socket.to(data.roomId).emit("user-typing", {
          profileId: data.profileId,
          name: data.name,
          isTyping: true,
        });
      });

      socket.on("typing-stop", (data: any) => {
        console.log("⏹️ User typing stop:", data);
        socket.to(data.roomId).emit("user-typing", {
          profileId: data.profileId,
          isTyping: false,
        });
      });

      /* -------- MESSAGE STATUS -------- */
      socket.on("message-delivered", (data: any) => {
        console.log("📬 Message delivered:", data);
        socket.to(data.roomId).emit("message-status-update", {
          messageId: data.messageId,
          delivered: true,
        });
      });

      socket.on("messages-read", (data: any) => {
        console.log("👁️ Messages read:", data);
        socket.to(data.roomId).emit("messages-status-update", {
          messageIds: data.messageIds,
          read: true,
        });

        const profileIds = data.roomId.split("_");
        profileIds.forEach((profileId: string) => {
          const userRoom = `user:${profileId}`;
          io.to(userRoom).emit("messages-marked-read", {
            messageIds: data.messageIds,
          });
        });
      });

      /* -------- CONNECTION ACCEPTED (Payment Flow) -------- */
      socket.on("connection-accepted", (data: {
        toProfileId: string;
        fromProfileId: string;
        fromName: string;
        fromImageUrl?: string;
        tier: string;
        requestId: string;
      }) => {
        console.log("💰 Connection accepted - Notifying sender for payment:", data);
        const toRoom = `user:${data.toProfileId}`;
        console.log(`📤 Emitting connection-accepted-notify to room: ${toRoom}`);
        io.to(toRoom).emit("connection-accepted-notify", {
          fromProfileId: data.fromProfileId,
          fromName: data.fromName,
          fromImageUrl: data.fromImageUrl,
          tier: data.tier,
          requestId: data.requestId,
          timestamp: new Date().toISOString(),
        });
      });

      /* -------- PAYMENT DECLINED -------- */
      socket.on("payment-declined", (data: {
        toProfileId: string;
        fromProfileId: string;
        requestId: string;
      }) => {
        console.log("❌ Payment declined - Notifying acceptor:", data);
        const toRoom = `user:${data.toProfileId}`;
        console.log(`📤 Emitting payment-declined-notify to room: ${toRoom}`);
        io.to(toRoom).emit("payment-declined-notify", {
          fromProfileId: data.fromProfileId,
          requestId: data.requestId,
          timestamp: new Date().toISOString(),
        });
      });

      /* -------- VIDEO CALL SIGNALING -------- */
      socket.on("video-call-offer", (data: {
        toProfileId: string;
        fromProfileId: string;
        fromName: string;
        fromImageUrl?: string;
        offer: RTCSessionDescriptionInit;
      }) => {
        console.log("📹 Video call offer from:", data.fromProfileId);
        io.to(`user:${data.toProfileId}`).emit("video-call-incoming", data);
      });

      socket.on("video-call-answer", (data: {
        toProfileId: string;
        answer: RTCSessionDescriptionInit;
      }) => {
        console.log("📹 Video call answered");
        io.to(`user:${data.toProfileId}`).emit("video-call-answered", data);
      });

      socket.on("video-call-ice-candidate", (data: {
        toProfileId: string;
        candidate: RTCIceCandidateInit;
      }) => {
        io.to(`user:${data.toProfileId}`).emit("video-call-ice-candidate", data);
      });

      socket.on("video-call-reject", (data: { toProfileId: string }) => {
        console.log("📹 Video call rejected");
        io.to(`user:${data.toProfileId}`).emit("video-call-rejected");
      });

      socket.on("video-call-end", (data: { toProfileId: string }) => {
        console.log("📹 Video call ended");
        io.to(`user:${data.toProfileId}`).emit("video-call-ended");
      });

      /* -------- DISCONNECT -------- */
      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
    console.log("✅ Socket.io server initialized");
  } else {
    console.log("♻️ Socket.io server already running");
  }

  res.end();
}