// types/socket.d.ts (if you don't have this already)
import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

// Global type for Socket.IO instance
declare global {
  var io: SocketIOServer | undefined;
}

export {};