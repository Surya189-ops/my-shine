// app/chat/[profileId]/page.tsx - Updated with Block/Report
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiSend, FiCheck, FiSearch } from "react-icons/fi";
import { io, Socket } from "socket.io-client";
import TypingIndicator from "@/app/components/TypingIndicator";
import ChatSearch from "@/app/components/ChatSearch";
import BlockReportMenu from "@/app/components/BlockReportMenu";

type Message = {
  _id: string;
  text: string;
  senderProfileId: string;
  receiverProfileId: string;
  delivered?: boolean;
  read?: boolean;
  createdAt: string;
};

type Profile = {
  _id: string;
  name: string;
  imageUrl?: string;
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const otherProfileId = params.profileId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [myProfileId, setMyProfileId] = useState<string>("");
  const [myName, setMyName] = useState<string>("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedBy, setIsBlockedBy] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const roomIdRef = useRef<string>("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const otherTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  /* -------- AUTH GUARD -------- */
  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(userStr);
   
    if (!user.profileId) {
      alert("Profile not found. Please create a profile first.");
      router.replace("/profile/create");
      return;
    }

    setMyProfileId(user.profileId);
    setMyName(user.name || "User");
  }, [router]);

  /* -------- CHECK BLOCK STATUS -------- */
  useEffect(() => {
    if (!myProfileId) return;

    fetch(`/api/block/check?myProfileId=${myProfileId}&otherProfileId=${otherProfileId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsBlocked(data.isBlocked);
          setIsBlockedBy(data.isBlockedBy);
        }
      })
      .catch((err) => console.error("Check block error:", err));
  }, [myProfileId, otherProfileId]);

  /* -------- TYPING HANDLERS -------- */
  const startTyping = useCallback(() => {
    if (!socketRef.current || !roomIdRef.current || isTypingRef.current || isBlockedBy) return;

    console.log("⌨️ Emitting typing-start");
    socketRef.current.emit("typing-start", {
      roomId: roomIdRef.current,
      profileId: myProfileId,
      name: myName,
    });
    isTypingRef.current = true;
  }, [myProfileId, myName, isBlockedBy]);

  const stopTyping = useCallback(() => {
    if (!socketRef.current || !roomIdRef.current || !isTypingRef.current) return;

    console.log("⏹️ Emitting typing-stop");
    socketRef.current.emit("typing-stop", {
      roomId: roomIdRef.current,
      profileId: myProfileId,
    });
    isTypingRef.current = false;
  }, [myProfileId]);

  const handleTyping = useCallback(() => {
    if (isBlockedBy) return;
    
    startTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [startTyping, stopTyping, isBlockedBy]);

  /* -------- SOCKET SETUP -------- */
  useEffect(() => {
    if (!myProfileId || socketRef.current) return;

    const roomId = [myProfileId, otherProfileId].sort().join("_");
    roomIdRef.current = roomId;

    const initSocket = async () => {
      await fetch("/api/socket");

      const socket = io({
        path: "/api/socket",
      });

      socketRef.current = socket;

      socket.emit("join-room", roomId);

      socket.off("receive-message").on("receive-message", (data: any) => {
        console.log("📩 Socket received message:", data);

        // Don't show messages if blocked
        if (isBlocked || isBlockedBy) {
          console.log("🚫 Message blocked");
          return;
        }

        setIsOtherTyping(false);
        if (otherTypingTimeoutRef.current) {
          clearTimeout(otherTypingTimeoutRef.current);
        }

        setMessages((prev) => {
          if (prev.some((m) => m._id === data._id)) return prev;
         
          const newMsg = {
            _id: data._id,
            text: data.text,
            senderProfileId: data.senderProfileId,
            receiverProfileId: data.receiverProfileId,
            delivered: true,
            read: false,
            createdAt: data.createdAt,
          };

          socket.emit("message-delivered", {
            roomId,
            messageId: data._id,
          });

          return [...prev, newMsg];
        });
      });

      socket.off("user-typing").on("user-typing", (data: any) => {
        console.log("⌨️ User typing event:", data);
       
        if (data.profileId !== myProfileId && !isBlocked && !isBlockedBy) {
          setIsOtherTyping(data.isTyping);

          if (data.isTyping) {
            if (otherTypingTimeoutRef.current) {
              clearTimeout(otherTypingTimeoutRef.current);
            }
            otherTypingTimeoutRef.current = setTimeout(() => {
              setIsOtherTyping(false);
            }, 3000);
          } else {
            if (otherTypingTimeoutRef.current) {
              clearTimeout(otherTypingTimeoutRef.current);
            }
          }
        }
      });

      socket.off("message-status-update").on("message-status-update", (data: any) => {
        console.log("📬 Message status update:", data);
       
        setMessages((prev) =>
          prev.map((m) =>
            m._id === data.messageId
              ? { ...m, delivered: data.delivered }
              : m
          )
        );
      });

      socket.off("messages-status-update").on("messages-status-update", (data: any) => {
        console.log("👁️ Messages status update:", data);
       
        setMessages((prev) =>
          prev.map((m) =>
            data.messageIds.includes(m._id)
              ? { ...m, read: data.read }
              : m
          )
        );
      });
    };

    initSocket();

    return () => {
      stopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (otherTypingTimeoutRef.current) {
        clearTimeout(otherTypingTimeoutRef.current);
      }
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [myProfileId, otherProfileId, stopTyping, isBlocked, isBlockedBy]);

  /* -------- FETCH PROFILE -------- */
  useEffect(() => {
    fetch(`/api/profile/by-id?profileId=${otherProfileId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProfile(data.profile);
      })
      .catch((err) => console.error("Profile fetch error:", err));
  }, [otherProfileId]);

  /* -------- LOAD CHAT HISTORY -------- */
  useEffect(() => {
    if (!myProfileId) return;

    console.log("📥 Fetching messages:", { myProfileId, otherProfileId });

    fetch(`/api/chat?myProfileId=${myProfileId}&otherProfileId=${otherProfileId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Messages fetched:", data);
        if (data.success) {
          // Hide messages if blocked
          if (isBlocked) {
            setMessages([]);
          } else {
            setMessages(data.messages);
            markMessagesAsRead(data.messages);
          }
        }
      })
      .catch((err) => console.error("Fetch messages error:", err));
  }, [myProfileId, otherProfileId, isBlocked]);

  /* -------- MARK MESSAGES AS READ -------- */
  const markMessagesAsRead = async (msgs: Message[]) => {
    if (isBlockedBy) return;

    const unreadIds = msgs
      .filter(
        (m) =>
          m.receiverProfileId === myProfileId &&
          !m.read
      )
      .map((m) => m._id);

    if (unreadIds.length === 0) return;

    try {
      await fetch("/api/chat/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageIds: unreadIds,
          myProfileId,
        }),
      });

      setMessages((prev) =>
        prev.map((m) =>
          unreadIds.includes(m._id) ? { ...m, read: true } : m
        )
      );

      if (socketRef.current) {
        socketRef.current.emit("messages-read", {
          roomId: roomIdRef.current,
          messageIds: unreadIds,
        });
      }
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  /* -------- AUTO SCROLL -------- */
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    if (messages.length > lastMessageCountRef.current || isOtherTyping) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      lastMessageCountRef.current = messages.length;

      if (messages.length > 0) {
        markMessagesAsRead(messages);
      }
    }
  }, [messages, isOtherTyping]);

  /* -------- SEARCH RESULT HANDLER -------- */
  const handleSearchResultClick = useCallback((messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("bg-yellow-100");
      setTimeout(() => {
        messageElement.classList.remove("bg-yellow-100");
      }, 2000);
    }
  }, []);

  /* -------- BLOCK STATUS CHANGE -------- */
  const handleBlockStatusChange = (blocked: boolean) => {
    setIsBlocked(blocked);
    if (blocked) {
      setMessages([]);
    } else {
      // Reload messages
      fetch(`/api/chat?myProfileId=${myProfileId}&otherProfileId=${otherProfileId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setMessages(data.messages);
          }
        });
    }
  };

  /* -------- SEND MESSAGE -------- */
  const handleSend = async () => {
    if (!newMessage.trim() || !myProfileId || isBlockedBy) return;

    const text = newMessage.trim();
    setNewMessage("");
    inputRef.current?.focus();

    stopTyping();

    console.log("📤 Sending message:", {
      senderProfileId: myProfileId,
      receiverProfileId: otherProfileId,
      text,
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderProfileId: myProfileId,
          receiverProfileId: otherProfileId,
          text,
        }),
      });

      const data = await res.json();

      console.log("✅ Message sent response:", data);

      if (data.success && socketRef.current) {
        const newMsg: Message = {
          _id: data.message._id,
          text: data.message.text,
          senderProfileId: myProfileId,
          receiverProfileId: otherProfileId,
          delivered: false,
          read: false,
          createdAt: data.message.createdAt || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);

        socketRef.current.emit("send-message", {
          roomId: roomIdRef.current,
          _id: data.message._id,
          text: data.message.text,
          senderProfileId: myProfileId,
          receiverProfileId: otherProfileId,
          createdAt: newMsg.createdAt,
        });
      } else {
        console.error("❌ Message send failed:", data);
        alert(data.message || "Failed to send message");
      }
    } catch (err) {
      console.error("❌ Send message error:", err);
      alert("Failed to send message");
    }
  };

  /* -------- TICK COMPONENT -------- */
  const MessageTicks = ({ message }: { message: Message }) => {
    if (message.senderProfileId !== myProfileId) return null;

    if (message.read) {
      return (
        <span className="inline-flex ml-1">
          <FiCheck size={14} className="text-blue-500 -mr-2" />
          <FiCheck size={14} className="text-blue-500" />
        </span>
      );
    }

    if (message.delivered) {
      return (
        <span className="inline-flex ml-1">
          <FiCheck size={14} className="text-gray-400 -mr-2" />
          <FiCheck size={14} className="text-gray-400" />
        </span>
      );
    }

    return (
      <span className="inline-flex ml-1">
        <FiCheck size={14} className="text-gray-400" />
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-pink-50">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => router.back()}>
            <FiArrowLeft size={20} />
          </button>

          <div
            onClick={() => router.push(`/profile/${otherProfileId}`)}
            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
          >
            {profile?.imageUrl ? (
              <img
                src={profile.imageUrl}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                alt={profile.name}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0" />
            )}

            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.name || "Loading..."}</p>
              <p className="text-xs text-gray-400">
                {isOtherTyping ? "typing..." : "Online"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiSearch size={20} className={isSearchOpen ? "text-pink-500" : "text-gray-600"} />
          </button>

          {/* Block/Report Menu */}
          <BlockReportMenu
            myProfileId={myProfileId}
            otherProfileId={otherProfileId}
            otherProfileName={profile?.name || "User"}
            isBlocked={isBlocked}
            onBlockStatusChange={handleBlockStatusChange}
          />
        </div>
      </div>

      {/* SEARCH BAR */}
      {isSearchOpen && (
        <ChatSearch
          messages={messages}
          onResultClick={handleSearchResultClick}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {/* BLOCKED MESSAGE */}
      {isBlocked && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-800">
          You have blocked this user. Unblock to send messages.
        </div>
      )}

      {isBlockedBy && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-center text-sm text-red-800">
          You cannot send messages to this user.
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isBlocked ? (
          <div className="text-center text-gray-400 text-sm mt-10">
            Chat history hidden. Unblock to view messages.
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">
            No messages yet. Start the conversation! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderProfileId === myProfileId;
           
            return (
              <div
                key={msg._id}
                ref={(el) => {
                  if (el) messageRefs.current[msg._id] = el;
                }}
                className={`flex ${isMine ? "justify-end" : "justify-start"} transition-colors duration-500`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl text-sm max-w-[70%] ${
                    isMine
                      ? "bg-pink-500 text-white rounded-br-none"
                      : "bg-white shadow rounded-bl-none"
                  }`}
                >
                  <div className="flex items-end gap-1">
                    <span>{msg.text}</span>
                    {isMine && <MessageTicks message={msg} />}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* TYPING INDICATOR */}
        {isOtherTyping && !isBlocked && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}
       
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="flex items-center gap-2 px-3 py-3 bg-white border-t">
        <input
          ref={inputRef}
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={isBlockedBy ? "You cannot send messages" : "Type a message…"}
          disabled={isBlockedBy}
          className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!newMessage.trim() || isBlockedBy}
          className="bg-pink-500 text-white p-2 rounded-full disabled:bg-gray-300 transition-colors"
        >
          <FiSend />
        </button>
      </div>
    </div>
  );
}