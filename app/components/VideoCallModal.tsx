"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhoneOff,
  FiPhone,
} from "react-icons/fi";

type Props = {
  socket: Socket;
  myProfileId: string;
  otherProfileId: string;
  otherName: string;
  otherImageUrl?: string;
  isIncoming: boolean;
  incomingOffer?: RTCSessionDescriptionInit;
  onClose: () => void;
};

export default function VideoCallModal({
  socket,
  myProfileId,
  otherProfileId,
  otherName,
  otherImageUrl,
  isIncoming,
  incomingOffer,
  onClose,
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  type CallState = "ringing" | "connecting" | "active" | "ended";
  const [callState, setCallState] = useState<CallState>(isIncoming ? "ringing" : "connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  /* -------- CLEANUP -------- */
  const cleanup = () => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  /* -------- START TIMER -------- */
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  /* -------- CREATE PEER CONNECTION -------- */
  const createPC = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("video-call-ice-candidate", {
          toProfileId: otherProfileId,
          candidate: candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallState("active");
        startTimer();
      }
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        endCall();
      }
    };

    return pc;
  };

  /* -------- INIT OUTGOING CALL -------- */
  useEffect(() => {
    if (isIncoming) return;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = createPC(stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("video-call-offer", {
          toProfileId: otherProfileId,
          fromProfileId: myProfileId,
          fromName: otherName,
          offer,
        });
      } catch (err) {
        console.error("Camera/mic error:", err);
        alert("Could not access camera or microphone.");
        onClose();
      }
    })();
  }, []);

  /* -------- HANDLE INCOMING SOCKET EVENTS -------- */
  useEffect(() => {
    socket.on("video-call-answered", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("video-call-ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("ICE candidate error:", e);
        }
      }
    });

    socket.on("video-call-rejected", () => {
      setCallState("ended");
      cleanup();
      setTimeout(onClose, 1500);
    });

    socket.on("video-call-ended", () => {
      setCallState("ended");
      cleanup();
      setTimeout(onClose, 1500);
    });

    return () => {
      socket.off("video-call-answered");
      socket.off("video-call-ice-candidate");
      socket.off("video-call-rejected");
      socket.off("video-call-ended");
    };
  }, []);

  /* -------- ACCEPT INCOMING CALL -------- */
  const acceptCall = async () => {
    try {
      setCallState("connecting");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPC(stream);

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingOffer!)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("video-call-answer", {
        toProfileId: otherProfileId,
        answer,
      });
    } catch (err) {
      console.error("Accept call error:", err);
      alert("Could not access camera or microphone.");
      rejectCall();
    }
  };

  /* -------- REJECT CALL -------- */
  const rejectCall = () => {
    socket.emit("video-call-reject", { toProfileId: otherProfileId });
    cleanup();
    onClose();
  };

  /* -------- END CALL -------- */
  const endCall = () => {
    socket.emit("video-call-end", { toProfileId: otherProfileId });
    setCallState("ended");
    cleanup();
    setTimeout(onClose, 1000);
  };

  /* -------- TOGGLE MIC -------- */
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  };

  /* -------- TOGGLE CAMERA -------- */
  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOff((c) => !c);
  };

  /* -------- CLEANUP ON UNMOUNT -------- */
  useEffect(() => () => cleanup(), []);

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Remote video — full screen background */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${callState !== "active" ? "hidden" : ""
          }`}
      />

      {/* Ringing / connecting state — show avatar */}
      {(callState === "ringing" || callState === "connecting") && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          {otherImageUrl ? (
            <img
              src={otherImageUrl}
              className="w-28 h-28 rounded-full object-cover border-4 border-white/20"
              alt={otherName}
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-600 flex items-center justify-center text-white text-4xl font-semibold">
              {otherName[0]?.toUpperCase()}
            </div>
          )}
          <p className="text-white text-2xl font-semibold">{otherName}</p>
          <p className="text-gray-400 text-sm animate-pulse">
            {callState === "ringing" ? "Incoming video call…" : "Connecting…"}
          </p>
        </div>
      )}

      {/* Ended state */}
      {callState === "ended" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-white text-xl font-semibold">Call ended</p>
          <p className="text-gray-400 text-sm">{formatDuration(callDuration)}</p>
        </div>
      )}

      {/* Active call — name overlay at top */}
      {callState === "active" && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-10 pb-4 bg-gradient-to-b from-black/50 to-transparent z-10">
          <p className="text-white font-semibold text-lg">{otherName}</p>
          <p className="text-white/70 text-sm">{formatDuration(callDuration)}</p>
        </div>
      )}

      {/* Local video — picture in picture */}
      <div className="absolute bottom-28 right-4 z-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg w-28 h-40">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${isCameraOff ? "hidden" : ""}`}
        />
        {isCameraOff && (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <FiVideoOff size={24} className="text-white/60" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-10 pt-6 bg-gradient-to-t from-black/60 to-transparent z-20">
        <div className="flex items-center justify-center gap-6">

          {/* Incoming call — reject + accept */}
          {callState === "ringing" && (
            <>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={rejectCall}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                >
                  <FiPhoneOff size={26} />
                </button>
                <span className="text-white/70 text-xs">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={acceptCall}
                  className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                >
                  <FiPhone size={26} />
                </button>
                <span className="text-white/70 text-xs">Accept</span>
              </div>
            </>
          )}

          {/* Active / connecting — mute + end + camera */}
          {(callState === "active" || callState === "connecting") && (
            <>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform ${isMuted ? "bg-white/30" : "bg-white/10 border border-white/20"
                    }`}
                >
                  {isMuted ? <FiMicOff size={22} /> : <FiMic size={22} />}
                </button>
                <span className="text-white/70 text-xs">{isMuted ? "Unmute" : "Mute"}</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                >
                  <FiPhoneOff size={26} />
                </button>
                <span className="text-white/70 text-xs">End</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleCamera}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform ${isCameraOff ? "bg-white/30" : "bg-white/10 border border-white/20"
                    }`}
                >
                  {isCameraOff ? <FiVideoOff size={22} /> : <FiVideo size={22} />}
                </button>
                <span className="text-white/70 text-xs">{isCameraOff ? "Camera on" : "Camera off"}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}