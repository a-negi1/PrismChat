import { useRef, useState, useCallback, useEffect } from "react";


const ICE_SERVERS = {
  iceServers: [

    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },

    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turns:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};


export function useWebRTC(socketRef, currentUserId) {
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidateQueue = useRef([]);
  const isCaller = useRef(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);



  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  }, []);

  const closePeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.onicecandidate = null;
      peerRef.current.ontrack = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    iceCandidateQueue.current = [];
  }, []);

  const cleanup = useCallback(() => {
    closePeer();
    stopLocalStream();
    remoteStreamRef.current = null;
    setRemoteStream(null);
    setCallActive(false);
    setAudioMuted(false);
    setVideoOff(false);
    isCaller.current = false;
  }, [closePeer, stopLocalStream]);



  const createPeer = useCallback((targetId, callType) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("call:ice-candidate", {
          targetId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "failed" || state === "disconnected" || state === "closed") {
        cleanup();
      }
    };

    peerRef.current = pc;
    return pc;
  }, [socketRef, cleanup]);



  const getLocalStream = useCallback(async (callType) => {
    const constraints = {
      audio: true,
      video: callType === "video" ? { width: 1280, height: 720, facingMode: "user" } : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);



  const startCall = useCallback(async ({ calleeId, callerName, callerPhoto, callType }) => {
    isCaller.current = true;
    const stream = await getLocalStream(callType);
    const pc = createPeer(calleeId, callType);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));


    socketRef.current?.emit("call:initiate", {
      callerId: currentUserId,
      callerName,
      callerPhoto,
      calleeId,
      callType,
    });
  }, [getLocalStream, createPeer, socketRef, currentUserId]);



  const sendOffer = useCallback(async ({ calleeId, callType }) => {
    const pc = peerRef.current;
    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.emit("call:offer", { calleeId, offer, callType });
  }, [socketRef]);



  const handleOffer = useCallback(async ({ offer, callType, callerId }) => {
    const pc = peerRef.current;
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));


    for (const candidate of iceCandidateQueue.current) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
    }
    iceCandidateQueue.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current?.emit("call:answer", { callerId, answer });
    setCallActive(true);
  }, [socketRef]);



  const handleAnswer = useCallback(async ({ answer }) => {
    const pc = peerRef.current;
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));


    for (const candidate of iceCandidateQueue.current) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
    }
    iceCandidateQueue.current = [];
    setCallActive(true);
  }, []);



  const handleIceCandidate = useCallback(async ({ candidate }) => {
    const pc = peerRef.current;
    if (!pc) return;

    if (pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
    } else {
      iceCandidateQueue.current.push(candidate);
    }
  }, []);



  const acceptCall = useCallback(async ({ callerId, callType }) => {
    isCaller.current = false;
    const stream = await getLocalStream(callType);
    const pc = createPeer(callerId, callType);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    socketRef.current?.emit("call:accepted", {
      callerId,
      calleeId: currentUserId,
    });
  }, [getLocalStream, createPeer, socketRef, currentUserId]);



  const endCall = useCallback((targetId) => {
    socketRef.current?.emit("call:end", { targetId });
    cleanup();
  }, [socketRef, cleanup]);



  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setAudioMuted((m) => !m);
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setVideoOff((v) => !v);
  }, []);

  return {

    localStream, remoteStream, callActive,
    audioMuted, videoOff,

    startCall, acceptCall, endCall, cleanup,
    sendOffer, handleOffer, handleAnswer, handleIceCandidate,
    toggleMute, toggleVideo,

    peerRef,
  };
}
