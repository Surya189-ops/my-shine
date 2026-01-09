// app/hooks/useTypingIndicator.ts
import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";

interface UseTypingIndicatorProps {
  socket: Socket | null;
  roomId: string;
  profileId: string;
  name: string;
}

export function useTypingIndicator({
  socket,
  roomId,
  profileId,
  name,
}: UseTypingIndicatorProps) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Emit typing start
  const startTyping = useCallback(() => {
    if (!socket || !roomId) return;

    // Only emit if not already typing
    if (!isTypingRef.current) {
      console.log("⌨️ Emitting typing-start");
      socket.emit("typing-start", {
        roomId,
        profileId,
        name,
      });
      isTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [socket, roomId, profileId, name]);

  // Emit typing stop
  const stopTyping = useCallback(() => {
    if (!socket || !roomId || !isTypingRef.current) return;

    console.log("⏹️ Emitting typing-stop");
    socket.emit("typing-stop", {
      roomId,
      profileId,
    });
    isTypingRef.current = false;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, roomId, profileId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  return { startTyping, stopTyping };
}