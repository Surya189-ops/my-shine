// app/chat/[profileId]/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiSend, FiCheck, FiSearch, FiImage, FiEye, FiVideo, FiCopy, FiTrash2, FiEdit2, FiGlobe } from "react-icons/fi";
import { io, Socket } from "socket.io-client";
import TypingIndicator from "@/app/components/TypingIndicator";
import ChatSearch from "@/app/components/ChatSearch";
import EditMessageModal from "@/app/components/EditMessageModal";
import ImagePicker from "@/app/components/ImagePicker";
import ImageViewer from "@/app/components/ImageViewer";
import VideoCallModal from "@/app/components/VideoCallModal";
import { useDarkMode } from "@/app/contexts/DarkModeContext";

type Message = {
  _id: string;
  text: string;
  senderProfileId: string;
  receiverProfileId: string;
  delivered?: boolean;
  read?: boolean;
  createdAt: string;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedBy?: string | null;
  deletedForEveryone?: boolean;
  imageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  isViewOnce?: boolean;
  viewedBy?: string[];
  viewedAt?: string | null;
};

type Profile = { _id: string; name: string; imageUrl?: string; };

type ContextMenuState = {
  messageId: string;
  messageText: string;
  messageCreatedAt: string;
  isMine: boolean;
  position: { x: number; y: number };
} | null;

type VideoCallState = {
  isIncoming: boolean;
  incomingOffer?: RTCSessionDescriptionInit;
  fromName?: string;
  fromImageUrl?: string;
} | null;

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const otherProfileId = (params?.profileId ?? "") as string;
  const { dark } = useDarkMode();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [myProfileId, setMyProfileId] = useState<string>("");
  const [myName, setMyName] = useState<string>("");
  const [isOnline, setIsOnline] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string; text: string } | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [viewingImage, setViewingImage] = useState<{
    url: string; caption?: string; isViewOnce?: boolean; messageId?: string; isSender?: boolean;
  } | null>(null);
  const [videoCall, setVideoCall] = useState<VideoCallState>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ messageId: string } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const roomIdRef = useRef<string>("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const otherTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  const initialScrollDone = useRef(false);

  /* ── AUTH ── */
  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) { router.replace("/login"); return; }
    const user = JSON.parse(userStr);
    if (!user.profileId) { alert("Profile not found."); router.replace("/profile"); return; }
    setMyProfileId(user.profileId);
    setMyName(user.name || "User");
  }, [router]);

  /* ── TYPING ── */
  const startTyping = useCallback(() => {
    if (!socketRef.current || !roomIdRef.current || isTypingRef.current) return;
    socketRef.current.emit("typing-start", { roomId: roomIdRef.current, profileId: myProfileId, name: myName });
    isTypingRef.current = true;
  }, [myProfileId, myName]);

  const stopTyping = useCallback(() => {
    if (!socketRef.current || !roomIdRef.current || !isTypingRef.current) return;
    socketRef.current.emit("typing-stop", { roomId: roomIdRef.current, profileId: myProfileId });
    isTypingRef.current = false;
  }, [myProfileId]);

  const handleTyping = useCallback(() => {
    startTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(), 2000);
  }, [startTyping, stopTyping]);

  /* ── SOCKET ── */
  useEffect(() => {
    if (!myProfileId || socketRef.current) return;
    const roomId = [myProfileId, otherProfileId].sort().join("_");
    roomIdRef.current = roomId;

    const initSocket = async () => {
      await fetch("/api/socket");
      const socket = io({ path: "/api/socket" });
      socketRef.current = socket;
      socket.emit("join-room", roomId);
      socket.emit("user-online", { profileId: myProfileId });

      socket.on("user-status", (data: { profileId: string; online: boolean }) => {
        if (data.profileId === otherProfileId) setIsOnline(data.online);
      });

      socket.off("receive-message").on("receive-message", (data: any) => {
        setIsOtherTyping(false);
        if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
        setMessages((prev) => {
          if (prev.some((m) => m._id === data._id)) return prev;
          const newMsg: Message = {
            _id: data._id, text: data.text || "",
            senderProfileId: data.senderProfileId, receiverProfileId: data.receiverProfileId,
            delivered: true, read: false, createdAt: data.createdAt,
            isEdited: data.isEdited || false, editedAt: data.editedAt,
            isDeleted: data.isDeleted || false, deletedBy: data.deletedBy || null,
            deletedForEveryone: data.deletedForEveryone || false,
            imageUrl: data.imageUrl || null, imageWidth: data.imageWidth || null,
            imageHeight: data.imageHeight || null, isViewOnce: data.isViewOnce || false,
            viewedBy: data.viewedBy || [],
          };
          socket.emit("message-delivered", { roomId, messageId: data._id });
          return [...prev, newMsg];
        });
      });

      socket.off("message-edited").on("message-edited", (data: any) => {
        setMessages((prev) => prev.map((m) => m._id === data.messageId
          ? { ...m, text: data.newText, isEdited: true, editedAt: data.editedAt } : m));
      });

      socket.off("message-deleted").on("message-deleted", (data: any) => {
        if (data.deletedForEveryone)
          setMessages((prev) => prev.map((m) => m._id === data.messageId
            ? { ...m, isDeleted: true, deletedForEveryone: true } : m));
      });

      socket.off("view-once-viewed").on("view-once-viewed", (data: any) => {
        setMessages((prev) => prev.map((m) => m._id === data.messageId
          ? { ...m, viewedBy: [...(m.viewedBy || []), data.viewedBy], viewedAt: data.viewedAt } : m));
      });

      socket.off("user-typing").on("user-typing", (data: any) => {
        if (data.profileId !== myProfileId) {
          setIsOtherTyping(data.isTyping);
          if (data.isTyping) {
            if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
            otherTypingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
          } else {
            if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
          }
        }
      });

      socket.off("message-status-update").on("message-status-update", (data: any) => {
        setMessages((prev) => prev.map((m) => m._id === data.messageId ? { ...m, delivered: data.delivered } : m));
      });

      socket.off("messages-status-update").on("messages-status-update", (data: any) => {
        setMessages((prev) => prev.map((m) => data.messageIds.includes(m._id) ? { ...m, read: data.read } : m));
      });

      socket.off("video-call-incoming").on("video-call-incoming", (data: any) => {
        setVideoCall({ isIncoming: true, incomingOffer: data.offer, fromName: data.fromName, fromImageUrl: data.fromImageUrl });
      });
    };

    initSocket();
    return () => {
      stopTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
      socketRef.current?.emit("user-offline", { profileId: myProfileId });
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [myProfileId, otherProfileId, stopTyping]);

  /* ── FETCH PROFILE ── */
  useEffect(() => {
    fetch(`/api/profile/by-id?profileId=${otherProfileId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setProfile(d.profile); })
      .catch(console.error);
  }, [otherProfileId]);

  /* ── LOAD HISTORY ── */
  useEffect(() => {
    if (!myProfileId) return;
    fetch(`/api/chat?myProfileId=${myProfileId}&otherProfileId=${otherProfileId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setMessages(d.messages); markMessagesAsRead(d.messages); }
      })
      .catch(console.error);
  }, [myProfileId, otherProfileId]);

  /* ── MARK READ ── */
  const markMessagesAsRead = async (msgs: Message[]) => {
    const unreadIds = msgs.filter((m) => m.receiverProfileId === myProfileId && !m.read && !m.isDeleted).map((m) => m._id);
    if (!unreadIds.length) return;
    try {
      await fetch("/api/chat/mark-read", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds: unreadIds, myProfileId }),
      });
      setMessages((prev) => prev.map((m) => unreadIds.includes(m._id) ? { ...m, read: true } : m));
      socketRef.current?.emit("messages-read", { roomId: roomIdRef.current, messageIds: unreadIds });
      window.dispatchEvent(new Event("refreshMessageBadge"));
    } catch (err) { console.error("Mark read error:", err); }
  };

  /* ── AUTO SCROLL ── */
  useEffect(() => {
    if (!bottomRef.current) return;
    if (!initialScrollDone.current && messages.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: "instant" as ScrollBehavior });
      initialScrollDone.current = true;
      markMessagesAsRead(messages);
    } else if (initialScrollDone.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
      markMessagesAsRead(messages);
    }
  }, [messages, isOtherTyping]);

  /* ── SEARCH ── */
  const handleSearchResultClick = useCallback((messageId: string) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add(dark ? "bg-yellow-900/40" : "bg-yellow-100");
      setTimeout(() => el.classList.remove(dark ? "bg-yellow-900/40" : "bg-yellow-100"), 2000);
    }
  }, [dark]);

  /* ── LONG PRESS / CONTEXT MENU ── */
  const handleLongPress = (e: React.MouseEvent | React.TouchEvent, message: Message) => {
    e.preventDefault();
    if (message.isDeleted || message.isViewOnce) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const y = "touches" in e ? e.touches[0].clientY : e.clientY;
    setContextMenu({
      messageId: message._id,
      messageText: message.text,
      messageCreatedAt: message.createdAt,
      isMine: message.senderProfileId === myProfileId,
      position: { x, y },
    });
  };

  /* ── EDIT ── */
  const handleEditMessage = async (messageId: string, newText: string) => {
    try {
      const res = await fetch("/api/chat/edit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, newText, profileId: myProfileId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, text: newText, isEdited: true, editedAt: data.message.editedAt } : m));
        if (socketRef.current && data.socketData) socketRef.current.emit("edit-message", data.socketData);
        setEditingMessage(null);
      } else alert(data.message || "Failed to edit");
    } catch { alert("Failed to edit message"); }
  };

  /* ── DELETE ── */
  const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    try {
      const res = await fetch("/api/chat/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, profileId: myProfileId, deleteForEveryone }),
      });
      const data = await res.json();
      if (data.success) {
        if (deleteForEveryone) {
          setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, isDeleted: true, deletedForEveryone: true } : m));
          if (socketRef.current && data.socketData) socketRef.current.emit("delete-message", data.socketData);
        } else {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        }
      } else alert(data.message || "Failed to delete");
    } catch { alert("Failed to delete message"); }
    setDeleteConfirm(null);
  };

  /* ── IMAGE ── */
  const handleImageSelect = async (imageData: { imageUrl: string; imageWidth: number; imageHeight: number; isViewOnce: boolean; caption?: string; }) => {
    setShowImagePicker(false);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderProfileId: myProfileId, receiverProfileId: otherProfileId, text: imageData.caption || "", imageUrl: imageData.imageUrl, imageWidth: imageData.imageWidth, imageHeight: imageData.imageHeight, isViewOnce: imageData.isViewOnce }),
      });
      const data = await res.json();
      if (data.success && socketRef.current) {
        const newMsg: Message = { _id: data.message._id, text: data.message.text || "", senderProfileId: myProfileId, receiverProfileId: otherProfileId, delivered: false, read: false, createdAt: data.message.createdAt || new Date().toISOString(), isEdited: false, isDeleted: false, imageUrl: data.message.imageUrl, imageWidth: data.message.imageWidth, imageHeight: data.message.imageHeight, isViewOnce: data.message.isViewOnce || false, viewedBy: [] };
        setMessages((prev) => [...prev, newMsg]);
        socketRef.current.emit("send-message", { roomId: roomIdRef.current, ...newMsg });
      } else alert(data.message || "Failed to send image");
    } catch { alert("Failed to send image"); }
  };

  const handleImageView = async (message: Message) => {
    const isSender = message.senderProfileId === myProfileId;
    const hasViewed = message.viewedBy?.includes(myProfileId);
    if (message.isViewOnce && message.receiverProfileId === myProfileId && !hasViewed) {
      try {
        const res = await fetch("/api/chat/mark-viewed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: message._id, profileId: myProfileId }) });
        const data = await res.json();
        if (data.success && socketRef.current && data.socketData) socketRef.current.emit("view-once-viewed", data.socketData);
      } catch (err) { console.error("Mark viewed error:", err); }
    }
    setViewingImage({ url: message.imageUrl!, caption: message.text, isViewOnce: message.isViewOnce, messageId: message._id, isSender });
  };

  const handleCloseImageViewer = () => {
    const { messageId, isViewOnce, isSender } = viewingImage || {};
    setViewingImage(null);
    if (isViewOnce && messageId && !isSender)
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, imageUrl: null, text: "" } : m));
  };

  /* ── SEND TEXT ── */
  const handleSend = async () => {
    if (!newMessage.trim() || !myProfileId) return;
    const text = newMessage.trim();
    setNewMessage("");
    stopTyping();

    // FIX: Keep keyboard open — refocus input after clearing
    // Use requestAnimationFrame for better mobile compatibility
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderProfileId: myProfileId, receiverProfileId: otherProfileId, text }),
      });
      const data = await res.json();
      if (data.success && socketRef.current) {
        const newMsg: Message = { _id: data.message._id, text: data.message.text, senderProfileId: myProfileId, receiverProfileId: otherProfileId, delivered: false, read: false, createdAt: data.message.createdAt || new Date().toISOString(), isEdited: false, isDeleted: false };
        setMessages((prev) => [...prev, newMsg]);
        socketRef.current.emit("send-message", { roomId: roomIdRef.current, _id: data.message._id, text: data.message.text, senderProfileId: myProfileId, receiverProfileId: otherProfileId, createdAt: newMsg.createdAt });
      } else alert(data.message || "Failed to send message");
    } catch { alert("Failed to send message"); }
  };

  /* ── TICKS ── */
  const MessageTicks = ({ message }: { message: Message }) => {
    if (message.senderProfileId !== myProfileId) return null;
    if (message.read) return <span className="inline-flex ml-1"><FiCheck size={14} className="text-blue-400 -mr-2" /><FiCheck size={14} className="text-blue-400" /></span>;
    if (message.delivered) return <span className="inline-flex ml-1"><FiCheck size={14} className="text-gray-400 -mr-2" /><FiCheck size={14} className="text-gray-400" /></span>;
    return <span className="inline-flex ml-1"><FiCheck size={14} className="text-gray-400" /></span>;
  };

  /* ── DELETED MESSAGE ── */
  const renderDeletedMessage = (message: Message) => {
    const isMine = message.senderProfileId === myProfileId;
    return (
      <div className={`px-4 py-2 rounded-2xl text-sm max-w-[70%] ${isMine ? "bg-pink-200 dark:bg-pink-900/50 text-gray-500 dark:text-gray-400 rounded-br-none" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow rounded-bl-none"}`}>
        <div className="flex items-center gap-2 italic">
          <span className="text-xs">🚫</span>
          <span>{message.deletedForEveryone ? (isMine ? "You deleted this message" : "This message was deleted") : "Message deleted"}</span>
        </div>
      </div>
    );
  };

  /* ── VIEW ONCE ── */
  const renderViewOnceMessage = (message: Message) => {
    const isMine = message.senderProfileId === myProfileId;
    const hasViewed = message.viewedBy?.includes(myProfileId);
    const hasImage = message.imageUrl && message.imageUrl.length > 0;
    if (!isMine && hasViewed && !hasImage) {
      return (
        <div className="px-4 py-3 rounded-2xl text-sm max-w-[70%] bg-gray-200 dark:bg-gray-700 shadow rounded-bl-none">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 italic"><FiEye size={16} /><span>Photo expired</span></div>
        </div>
      );
    }
    return null;
  };

  /* ── IMAGE MESSAGE ── */
  const renderImageMessage = (message: Message) => {
    const isMine = message.senderProfileId === myProfileId;
    const hasViewed = message.viewedBy?.includes(myProfileId);
    if (message.isViewOnce && !isMine && hasViewed) return renderViewOnceMessage(message);
    if (!message.imageUrl) return renderViewOnceMessage(message);
    const shouldBlur = message.isViewOnce && !hasViewed;
    return (
      <div className={`max-w-[70%] ${isMine ? "ml-auto" : "mr-auto"}`} onClick={() => handleImageView(message)}>
        <div className={`relative rounded-2xl overflow-hidden cursor-pointer ${isMine ? "rounded-br-none" : "rounded-bl-none"}`}>
          {shouldBlur && <div className="absolute inset-0 z-0"><img src={message.imageUrl} alt="" className="w-full h-full object-cover blur-3xl scale-110" /></div>}
          <div className={`relative ${shouldBlur ? "z-10" : ""}`}>
            {message.isViewOnce && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white text-gray-800 px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow-lg"><FiEye size={18} /><span>View Once</span></div>
                <p className="text-white text-xs mt-2 opacity-90">Tap to view</p>
              </div>
            )}
            <img src={message.imageUrl} alt="Shared image" className={`max-w-full h-auto object-contain ${shouldBlur ? "blur-2xl" : ""}`} style={{ maxHeight: "400px" }} />
          </div>
          {message.text && (
            <div className={`relative z-30 px-3 py-2 ${isMine ? "bg-pink-500 text-white" : "bg-white dark:bg-gray-700 dark:text-gray-100"}`}>
              <div className="flex items-end gap-1"><span className="text-sm">{message.text}</span>{isMine && <MessageTicks message={message} />}</div>
            </div>
          )}
          {!message.text && isMine && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 rounded-full px-2 py-1 z-30"><MessageTicks message={message} /></div>
          )}
        </div>
      </div>
    );
  };

  /* ── STATUS ── */
  const statusText = isOtherTyping ? "typing..." : isOnline ? "Online" : "Offline";
  const statusColor = isOtherTyping ? "text-pink-400" : isOnline ? "text-green-400" : dark ? "text-gray-500" : "text-gray-400";

  /* ── CUSTOM CONTEXT MENU (fully dark-mode aware, no external component) ── */
  const renderContextMenu = () => {
    if (!contextMenu) return null;

    const menuW = 200;
    const menuH = contextMenu.isMine ? 160 : 120;
    const left = Math.min(contextMenu.position.x, window.innerWidth - menuW - 10);
    const top = Math.min(contextMenu.position.y, window.innerHeight - menuH - 10);

    const menuBg  = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
    const itemCls = `w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors`;
    const textCls = dark ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50";
    const redCls  = dark ? "text-red-400 hover:bg-gray-700" : "text-red-500 hover:bg-red-50";
    const divCls  = dark ? "border-gray-700" : "border-gray-100";

    return (
      <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} onContextMenu={(e) => e.preventDefault()}>
        <div
          className={`absolute rounded-2xl shadow-2xl border overflow-hidden ${menuBg}`}
          style={{ top, left, minWidth: menuW }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Copy */}
          {contextMenu.messageText && (
            <button
              className={`${itemCls} ${textCls}`}
              onClick={() => {
                navigator.clipboard?.writeText(contextMenu.messageText);
                setContextMenu(null);
              }}
            >
              <FiCopy size={16} />
              <span>Copy</span>
            </button>
          )}

          {/* Edit — only mine & has text */}
          {contextMenu.isMine && contextMenu.messageText && (
            <>
              <div className={`border-t ${divCls}`} />
              <button
                className={`${itemCls} ${textCls}`}
                onClick={() => {
                  setEditingMessage({ id: contextMenu.messageId, text: contextMenu.messageText });
                  setContextMenu(null);
                }}
              >
                <FiEdit2 size={16} />
                <span>Edit</span>
              </button>
            </>
          )}

          {/* Delete */}
          <div className={`border-t ${divCls}`} />
          <button
            className={`${itemCls} ${redCls}`}
            onClick={() => {
              setDeleteConfirm({ messageId: contextMenu.messageId });
              setContextMenu(null);
            }}
          >
            <FiTrash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  };

  /* ── DELETE CONFIRM MODAL ── */
  const renderDeleteConfirm = () => {
    if (!deleteConfirm) return null;
    const msg = messages.find((m) => m._id === deleteConfirm.messageId);
    const isMine = msg?.senderProfileId === myProfileId;

    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6">
        <div className={`rounded-2xl p-6 w-full max-w-xs shadow-2xl ${dark ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`font-bold text-base mb-1 ${dark ? "text-gray-100" : "text-gray-800"}`}>Delete Message?</h3>
          <p className={`text-sm mb-5 ${dark ? "text-gray-400" : "text-gray-500"}`}>Choose how you want to delete this message.</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleDeleteMessage(deleteConfirm.messageId, false)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold ${dark ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} transition-colors`}
            >
              Delete for me
            </button>
            {isMine && (
              <button
                onClick={() => handleDeleteMessage(deleteConfirm.messageId, true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete for everyone
              </button>
            )}
            <button
              onClick={() => setDeleteConfirm(null)}
              className={`w-full py-2.5 rounded-xl text-sm ${dark ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"} transition-colors`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-screen ${dark ? "bg-gray-900" : "bg-pink-50"}`}>

      {/* HEADER */}
      <div className={`flex items-center justify-between px-4 py-3 shadow flex-shrink-0 ${dark ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => router.back()}>
            <FiArrowLeft size={20} className={dark ? "text-gray-300" : "text-gray-700"} />
          </button>
          <div onClick={() => router.push(`/profile/${otherProfileId}`)} className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
            {profile?.imageUrl
              ? <img src={profile.imageUrl} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={profile.name} />
              : <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
            }
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${dark ? "text-gray-100" : "text-gray-800"}`}>{profile?.name || "Loading..."}</p>
              <p className={`text-xs font-medium ${statusColor}`}>{statusText}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setVideoCall({ isIncoming: false })} className={`p-2 rounded-full transition-colors ${dark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
            <FiVideo size={20} className={dark ? "text-gray-300" : "text-gray-600"} />
          </button>
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 rounded-full transition-colors ${dark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
            <FiSearch size={20} className={isSearchOpen ? "text-pink-500" : dark ? "text-gray-300" : "text-gray-600"} />
          </button>
        </div>
      </div>

      {isSearchOpen && <ChatSearch messages={messages} onResultClick={handleSearchResultClick} onClose={() => setIsSearchOpen(false)} />}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col">
        <div className="flex-1" />
        <div className="flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className={`text-center text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
              No messages yet. Start the conversation! 👋
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderProfileId === myProfileId;
              return (
                <div
                  key={msg._id}
                  ref={(el) => { if (el) messageRefs.current[msg._id] = el; }}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} transition-colors duration-500`}
                  onContextMenu={(e) => handleLongPress(e, msg)}
                  onTouchStart={(e) => {
                    const timer = setTimeout(() => handleLongPress(e, msg), 500);
                    e.currentTarget.ontouchend = () => clearTimeout(timer);
                  }}
                >
                  {msg.isDeleted ? renderDeletedMessage(msg)
                    : msg.imageUrl ? renderImageMessage(msg)
                    : (
                      <div className={`px-4 py-2 rounded-2xl text-sm max-w-[70%] ${
                        isMine
                          ? "bg-pink-500 text-white rounded-br-none"
                          : dark
                            ? "bg-gray-700 text-gray-100 shadow rounded-bl-none"
                            : "bg-white text-gray-800 shadow rounded-bl-none"
                      }`}>
                        <div className="flex items-end gap-1">
                          <div className="flex flex-col">
                            <span>{msg.text}</span>
                            {msg.isEdited && (
                              <span className={`text-xs mt-1 ${isMine ? "text-pink-200" : dark ? "text-gray-400" : "text-gray-400"}`}>edited</span>
                            )}
                          </div>
                          {isMine && <MessageTicks message={msg} />}
                        </div>
                      </div>
                    )}
                </div>
              );
            })
          )}
          {isOtherTyping && <div className="flex justify-start"><TypingIndicator /></div>}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className={`flex-shrink-0 flex items-center gap-2 px-3 py-3 border-t ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <button
          onClick={() => setShowImagePicker(true)}
          className={`p-2 rounded-full transition-colors ${dark ? "text-gray-400 hover:text-pink-400 hover:bg-gray-700" : "text-gray-600 hover:text-pink-500 hover:bg-pink-50"}`}
        >
          <FiImage size={22} />
        </button>
        {/*
          FIX: Remove key/card/location icons from keyboard toolbar.
          These are browser/keyboard suggestion bar icons injected by Android Chrome.
          We use inputMode="text" + autoComplete="off" + autoCorrect="off"
          to suppress them as much as possible.
        */}
        <input
          ref={inputRef}
          value={newMessage}
          onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message…"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          className={`flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 ${
            dark
              ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
          }`}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="bg-pink-500 text-white p-2 rounded-full disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors flex-shrink-0"
        >
          <FiSend />
        </button>
      </div>

      {/* CUSTOM CONTEXT MENU */}
      {renderContextMenu()}

      {/* DELETE CONFIRM */}
      {renderDeleteConfirm()}

      {editingMessage && <EditMessageModal messageId={editingMessage.id} currentText={editingMessage.text} onSave={handleEditMessage} onCancel={() => setEditingMessage(null)} />}
      {showImagePicker && <ImagePicker onImageSelect={handleImageSelect} onCancel={() => setShowImagePicker(false)} />}
      {viewingImage && <ImageViewer imageUrl={viewingImage.url} caption={viewingImage.caption} isViewOnce={viewingImage.isViewOnce} isSender={viewingImage.isSender} onClose={handleCloseImageViewer} />}
      {videoCall && profile && socketRef.current && (
        <VideoCallModal socket={socketRef.current} myProfileId={myProfileId} otherProfileId={otherProfileId} otherName={profile.name} otherImageUrl={profile.imageUrl} isIncoming={videoCall.isIncoming} incomingOffer={videoCall.incomingOffer} onClose={() => setVideoCall(null)} />
      )}
    </div>
  );
}