"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiSend, FiLock, FiClock } from "react-icons/fi";
import { io, Socket } from "socket.io-client";

type Message = {
  id: string;
  text: string;
  sender: "me" | "other";
};

type Profile = {
  name: string;
  imageUrl?: string;
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.profileId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [canChat, setCanChat] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* -------- AUTH GUARD -------- */
  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) router.replace("/login");
  }, [router]);

  /* -------- SOCKET SETUP -------- */
  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr || socketRef.current) return;

    const user = JSON.parse(userStr);
    const roomId = [user.id, profileId].sort().join("_");

    const socket = io({ path: "/api/socket" });
    socketRef.current = socket;

    socket.emit("join-room", roomId);
    socket.emit("user-online", user.id);

    socket.on("receive-message", (data) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data._id)) return prev;
        return [
          ...prev,
          {
            id: data._id,
            text: data.text,
            sender: data.senderId === user.id ? "me" : "other",
          },
        ];
      });
    });

    socket.on("typing", (senderId) => {
      if (senderId === user.id) return;

      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    });

    socket.on("user-online", () => {
      setIsOnline(true);
      setLastSeen(null);
    });

    socket.on("user-offline", (data) => {
      setIsOnline(false);
      setLastSeen(data.lastSeen);
    });

    return () => {
      socket.emit("user-offline", user.id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [profileId]);

  /* -------- FETCH PROFILE -------- */
  useEffect(() => {
    fetch(`/api/profile/by-id?profileId=${profileId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProfile(data.profile);
      });
  }, [profileId]);

  /* -------- CHECK CHAT ACCESS + TIMER -------- */
  useEffect(() => {
    fetch("/api/bookings/cleanup", { method: "POST" });

    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    fetch(`/api/bookings/active?userId=${user.id}&profileId=${profileId}`)
      .then((res) => {
        if (res.status === 403) {
          setCanChat(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success) {
          setCanChat(true);
          const end = new Date(data.booking.endTime).getTime();
          const seconds = Math.floor((end - Date.now()) / 1000);
          setTimeLeft(seconds > 0 ? seconds : 0);
        }
      })
      .finally(() => setCheckingAccess(false));
  }, [profileId]);

  /* -------- COUNTDOWN -------- */
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev || prev <= 1) {
          setCanChat(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  /* -------- LOAD CHAT HISTORY -------- */
  useEffect(() => {
    if (!canChat) return;

    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    fetch(`/api/chat?senderId=${user.id}&receiverId=${profileId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m._id,
              text: m.text,
              sender: m.senderId === user.id ? "me" : "other",
            }))
          );
        }
      });
  }, [profileId, canChat]);

  /* -------- AUTO SCROLL -------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------- SEND MESSAGE -------- */
  const handleSend = async () => {
    if (!newMessage.trim() || !canChat) return;

    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: user.id,
        receiverId: profileId,
        text: newMessage,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: data.message._id,
          text: data.message.text,
          sender: "me",
        },
      ]);

      socketRef.current?.emit("send-message", {
        roomId: [user.id, profileId].sort().join("_"),
        _id: data.message._id,
        text: data.message.text,
        senderId: user.id,
      });

      setNewMessage("");
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatLastSeen = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins <= 0) return "just now";
    if (mins === 1) return "1 min ago";
    return `${mins} min ago`;
  };

  return (
    <div className="flex flex-col h-screen bg-pink-50 relative">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <FiArrowLeft size={20} />
          </button>

          {profile?.imageUrl ? (
            <img src={profile.imageUrl} className="w-9 h-9 rounded-full" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-300" />
          )}

          <div>
            <p className="text-sm font-semibold">{profile?.name}</p>
            <p className="text-xs text-gray-400">
              {!canChat
                ? "Chat locked"
                : isTyping
                ? "typing…"
                : isOnline
                ? "Online"
                : lastSeen
                ? `Last seen ${formatLastSeen(lastSeen)}`
                : "Offline"}
            </p>
          </div>
        </div>

        {canChat && timeLeft !== null && (
          <div className="flex items-center gap-1 text-xs text-pink-600">
            <FiClock />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && canChat && (
          <p className="text-center text-sm text-gray-400 mt-6">
            Say hi 👋 and start the conversation
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl text-sm max-w-[70%] ${
                msg.sender === "me"
                  ? "bg-pink-500 text-white rounded-br-none"
                  : "bg-white shadow rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="flex items-center gap-2 px-3 py-3 bg-white border-t">
        <input
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            if (!canChat) return;

            const userStr = localStorage.getItem("myshine_user");
            if (!userStr) return;

            const user = JSON.parse(userStr);
            socketRef.current?.emit("typing", user.id);
          }}
          disabled={!canChat}
          placeholder={canChat ? "Type a message..." : "Chat time expired"}
          className="flex-1 px-4 py-2 border rounded-full text-sm disabled:bg-gray-100"
        />
        <button
          onClick={handleSend}
          disabled={!canChat}
          className="bg-pink-500 text-white p-2 rounded-full disabled:bg-gray-300"
        >
          <FiSend />
        </button>
      </div>

      {/* LOCK OVERLAY */}
      {!checkingAccess && !canChat && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20 px-6 text-center">
          <FiLock size={36} className="mb-3" />
          <p className="text-lg font-semibold mb-2">Chat ended</p>
          <button
            onClick={() =>
              router.push(`/payment?profileId=${profileId}&rebook=true`)
            }
            className="bg-pink-500 px-6 py-3 rounded-full font-semibold"
          >
            Book again (1 tap)
          </button>
        </div>
      )}
    </div>
  );
}
