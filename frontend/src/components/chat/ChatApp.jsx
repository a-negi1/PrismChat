import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useNotifications } from "@/hooks/useNotifications";
import { api } from "@/services/api";
import { getChatId, getGroupChatId, isGroupChat } from "@/utils/helpers";
import AsideBar from "@/components/layout/AsideBar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import ProfilePanel from "@/components/chat/ProfilePanel";
import AIChat from "@/components/chat/AIChat";
import CallModal from "@/components/chat/CallModal";
import IncomingCallModal from "@/components/chat/IncomingCallModal";
import Lightbox from "@/components/ui/lightbox";
import ToastContainer from "@/components/ui/toast";
import { cn } from "@/utils/cn";
import Watermark from "@/components/ui/Watermark";

const EmptyState = ({ onOpenSidebar }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6 bg-background h-full">
    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
      <span className="text-3xl">💬</span>
    </div>
    <div>
      <h2 className="font-semibold text-lg">No chat selected</h2>
      <p className="text-sm text-muted-foreground mt-1">Pick a conversation or start a new one</p>
    </div>
    {onOpenSidebar && (
      <button
        onClick={onOpenSidebar}
        className="md:hidden mt-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Open chats
      </button>
    )}
  </div>
);


export default function ChatApp({ currentUser: initialUser, onSignOut, onUserUpdate }) {
  const [currentUser, setCurrentUser] = useState(initialUser);

  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAIActive, setIsAIActive] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimers = useRef({});


  const [callState, setCallState] = useState("idle");
  const [callType, setCallType] = useState("voice");
  const [callPeer, setCallPeer] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);


  const callStateRef = useRef("idle");
  const callTypeRef = useRef("voice");
  const callPeerRef = useRef(null);
  const incomingRef = useRef(null);

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { callTypeRef.current = callType; }, [callType]);
  useEffect(() => { callPeerRef.current = callPeer; }, [callPeer]);
  useEffect(() => { incomingRef.current = incomingCallData; }, [incomingCallData]);

  const activeChatRef = useRef(null);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p.slice(-3), { ...toast, id }]);
  }, []);
  const dismissToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  const { handlePushNotification } = useNotifications({
    currentUserId: currentUser._id,
    activeChatRef,
    onToast: addToast,
  });



  const handleMessage = useCallback((newMsg) => {
    const cur = activeChatRef.current;
    const curChatId = cur && !isGroupChat(cur) ? getChatId(currentUser._id, cur._id) : null;
    if (newMsg.chatId === curChatId) {
      setMessages((p) => p.find((m) => m._id === newMsg._id) ? p : [...p, newMsg]);
    }
    setChats((prev) => {
      const partnerId = newMsg.chatId.split("_").find((id) => id !== currentUser._id);
      if (!partnerId) return prev;
      const idx = prev.findIndex((c) => c._id === partnerId);
      if (idx > -1) {
        const updated = [...prev];
        updated.splice(idx, 1);
        return [{ ...prev[idx], lastMsg: newMsg }, ...updated];
      }
      return [{ _id: partnerId, name: newMsg.senderName, lastMsg: newMsg, online: true }, ...prev];
    });
  }, [currentUser._id]);

  const handleGroupMessage = useCallback((newMsg) => {
    const cur = activeChatRef.current;
    const curChatId = cur && isGroupChat(cur) ? getGroupChatId(cur._id) : null;
    if (newMsg.chatId === curChatId) {
      setMessages((p) => p.find((m) => m._id === newMsg._id) ? p : [...p, newMsg]);
    } else if (newMsg.senderId !== currentUser._id) {
      setUnreadCounts((p) => ({ ...p, [newMsg.chatId]: (p[newMsg.chatId] || 0) + 1 }));
    }
    setGroups((prev) => {
      const gId = newMsg.chatId.replace("group_", "");
      const idx = prev.findIndex((g) => g._id === gId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated.splice(idx, 1);
      return [{ ...prev[idx], lastMsg: newMsg }, ...updated];
    });
  }, [currentUser._id]);

  const handleReactionUpdated = useCallback((updatedMsg) =>
    setMessages((p) => p.map((m) => m._id === updatedMsg._id ? { ...m, reactions: updatedMsg.reactions } : m)),
    []);

  const handleGroupUpdated = useCallback((updatedGroup) => {
    setGroups((p) => p.map((g) => g._id === updatedGroup._id ? { ...g, ...updatedGroup } : g));
    setActiveChat((cur) => cur && isGroupChat(cur) && cur._id === updatedGroup._id ? { ...cur, ...updatedGroup } : cur);
  }, []);

  const handleUserStatus = useCallback(({ userId, online, lastSeen }) => {
    const id = userId?.toString?.() ?? userId;
    setChats((p) => p.map((c) => c._id === id ? { ...c, online, lastSeen } : c));
    setActiveChat((cur) => cur && !isGroupChat(cur) && cur._id === id ? { ...cur, online, lastSeen } : cur);
  }, []);

  const handleUnreadUpdate = useCallback(({ chatId, count }) =>
    setUnreadCounts((p) => ({ ...p, [chatId]: count })),
    []);

  const handleTyping = useCallback(({ senderId, senderName, groupId }) => {
    const key = groupId ? `group_${groupId}` : [currentUser._id, senderId].sort().join("_");
    setTypingUsers((p) => {
      const existing = p[key] || [];
      if (existing.find((u) => u.senderId === senderId)) return p;
      return { ...p, [key]: [...existing, { senderId, senderName }] };
    });
    const timer = `${key}:${senderId}`;
    if (typingTimers.current[timer]) clearTimeout(typingTimers.current[timer]);
    typingTimers.current[timer] = setTimeout(() => {
      setTypingUsers((p) => {
        const next = { ...p, [key]: (p[key] || []).filter((u) => u.senderId !== senderId) };
        if (!next[key]?.length) delete next[key];
        return next;
      });
    }, 3000);
  }, [currentUser._id]);

  const handleStopTyping = useCallback(({ senderId, groupId }) => {
    const key = groupId ? `group_${groupId}` : [currentUser._id, senderId].sort().join("_");
    const timer = `${key}:${senderId}`;
    if (typingTimers.current[timer]) clearTimeout(typingTimers.current[timer]);
    setTypingUsers((p) => {
      const next = { ...p, [key]: (p[key] || []).filter((u) => u.senderId !== senderId) };
      if (!next[key]?.length) delete next[key];
      return next;
    });
  }, [currentUser._id]);


  const webrtcRef = useRef(null);
  const emitCallBusyRef = useRef(null);
  const emitCallRejectRef = useRef(null);
  const emitCallEndRef = useRef(null);

  const handleCallIncoming = useCallback((data) => {
    if (callStateRef.current !== "idle") {
      emitCallBusyRef.current?.({ callerId: data.callerId });
      return;
    }
    setIncomingCallData(data);
    setCallType(data.callType || "voice");
    setCallState("incoming");
  }, []);

  const handleCallAccepted = useCallback(async ({ calleeId }) => {
    setCallState("in-call");
    try {
      await webrtcRef.current?.sendOffer({ calleeId, callType: callTypeRef.current });
    } catch (err) {
      console.error("sendOffer failed:", err);
    }
  }, []);

  const handleCallRejected = useCallback(() => {
    addToast({ title: "Call declined", body: "The other user declined your call." });
    webrtcRef.current?.cleanup();
    setCallState("idle");
    setCallPeer(null);
  }, [addToast]);

  const handleCallOffer = useCallback(async ({ offer, callType: ct }) => {
    setCallType(ct);
    const callerId = callPeerRef.current?._id || incomingRef.current?.callerId;
    try {
      await webrtcRef.current?.handleOffer({ offer, callType: ct, callerId });
    } catch (err) {
      console.error("handleOffer failed:", err);
    }
    setCallState("in-call");
  }, []);

  const handleCallAnswer = useCallback(async ({ answer }) => {
    try {
      await webrtcRef.current?.handleAnswer({ answer });
    } catch (err) {
      console.error("handleAnswer failed:", err);
    }
    setCallState("in-call");
  }, []);

  const handleCallIceCandidate = useCallback(({ candidate }) => {
    webrtcRef.current?.handleIceCandidate({ candidate });
  }, []);

  const handleCallEnded = useCallback(() => {
    webrtcRef.current?.cleanup();
    setCallState("idle");
    setCallPeer(null);
    setIncomingCallData(null);
    addToast({ title: "Call ended", body: "The call has ended." });
  }, [addToast]);

  const handleCallBusy = useCallback(() => {
    addToast({ title: "User is busy", body: "The other user is already in a call." });
    webrtcRef.current?.cleanup();
    setCallState("idle");
    setCallPeer(null);
  }, [addToast]);



  const {
    sendMessage: socketSend, sendGroupMessage: socketSendGroup,
    joinGroup, markRead, markGroupRead,
    emitGroupUpdated, emitUserLeftGroup, disconnectUser, emitReaction,
    emitTyping, emitStopTyping,
    emitCallInitiate, emitCallAccepted, emitCallReject,
    emitCallOffer, emitCallAnswer, emitCallIceCandidate, emitCallEnd, emitCallBusy,
    socketRef,
  } = useSocket(currentUser._id, {
    onMessage: handleMessage,
    onGroupMessage: handleGroupMessage,
    onUserStatus: handleUserStatus,
    onUnreadUpdate: handleUnreadUpdate,
    onGroupUpdated: handleGroupUpdated,
    onReactionUpdated: handleReactionUpdated,
    onPushNotification: handlePushNotification,
    onTyping: handleTyping,
    onStopTyping: handleStopTyping,
    onCallIncoming: handleCallIncoming,
    onCallAccepted: handleCallAccepted,
    onCallRejected: handleCallRejected,
    onCallOffer: handleCallOffer,
    onCallAnswer: handleCallAnswer,
    onCallIceCandidate: handleCallIceCandidate,
    onCallEnded: handleCallEnded,
    onCallBusy: handleCallBusy,
  });


  useEffect(() => {
    emitCallBusyRef.current = emitCallBusy;
    emitCallRejectRef.current = emitCallReject;
    emitCallEndRef.current = emitCallEnd;
  }, [emitCallBusy, emitCallReject, emitCallEnd]);



  const webRTC = useWebRTC(socketRef, currentUser._id);


  useEffect(() => {
    webrtcRef.current = webRTC;
  });

  const {
    localStream, remoteStream, callActive,
    audioMuted, videoOff,
    startCall, acceptCall,
    toggleMute, toggleVideo,
    cleanup,
  } = webRTC;



  useEffect(() => {
    api.getUserChats(currentUser._id).then(setChats);
    api.getUserGroups(currentUser._id).then((gs) => {
      setGroups(gs);
      gs.forEach((g) => joinGroup(g._id));
    });
    api.getUnreadCounts(currentUser._id).then(setUnreadCounts);
  }, [currentUser._id]);

  useEffect(() => {
    if (!activeChat) return;
    const chatId = isGroupChat(activeChat)
      ? getGroupChatId(activeChat._id)
      : getChatId(currentUser._id, activeChat._id);

    api.getMessages(chatId).then((data) => {
      setMessages(data);
      setSharedMedia(data.filter((m) => m.fileType === "image" || m.image).map((m) => m.fileUrl || m.image));
    });

    api.markMessagesRead(chatId, currentUser._id);
    if (isGroupChat(activeChat)) markGroupRead(chatId);
    else markRead(chatId);
    setUnreadCounts((p) => ({ ...p, [chatId]: 0 }));
  }, [activeChat?._id]);


  const startChatWith = (user) => {
    const existing = chats.find((c) => c._id === user._id);
    const merged = existing
      ? { ...existing, ...user, online: user.online ?? existing.online, lastSeen: user.lastSeen ?? existing.lastSeen }
      : user;
    setActiveChat(merged);
    setShowProfile(false);
    setIsAIActive(false);
    setReplyTo(null);
    if (!existing) setChats((p) => [merged, ...p]);
  };

  const selectGroup = (group) => {
    setActiveChat(group); setShowProfile(false); setIsAIActive(false); setReplyTo(null);
    joinGroup(group._id);
  };

  const selectAI = () => {
    setActiveChat(null); setIsAIActive(true); setShowProfile(false); setReplyTo(null);
  };

  const handleGroupCreated = (group) => {
    setGroups((p) => [group, ...p]);
    joinGroup(group._id);
    selectGroup(group);
  };



  const handleSend = () => {
    if (!activeChat || !input.trim()) return;
    setSending(true);
    const payload = {
      senderId: currentUser._id, senderName: currentUser.name,
      text: input.trim(), image: null,
      fileUrl: "", fileType: "", fileName: "",
      replyTo: replyTo ? {
        _id: replyTo._id, text: replyTo.text, image: replyTo.image,
        senderId: replyTo.senderId, senderName: replyTo.senderName,
      } : null,
    };
    if (isGroupChat(activeChat)) socketSendGroup({ ...payload, groupId: activeChat._id });
    else socketSend({ ...payload, receiverId: activeChat._id });
    setInput(""); setReplyTo(null); setSending(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file || !activeChat) return;
    setUploading(true);
    try {
      const data = await api.uploadFile(file);
      if (data.error) throw new Error(data.error);
      const payload = {
        senderId: currentUser._id, senderName: currentUser.name,
        text: "", image: data.fileType === "image" ? data.secure_url : "",
        fileUrl: data.secure_url, fileType: data.fileType, fileName: data.fileName,
        replyTo: null,
      };
      if (isGroupChat(activeChat)) socketSendGroup({ ...payload, groupId: activeChat._id });
      else socketSend({ ...payload, receiverId: activeChat._id });
    } catch (err) { addToast({ title: "Upload failed", body: err.message }); }
    setUploading(false);
    if (e.target) e.target.value = "";
  };

  const handleReact = async (msg, emoji, action) => {
    if (action === "reply") { setReplyTo(msg); return; }
    try {
      const updated = await api.reactToMessage(msg._id, currentUser._id, emoji);
      if (updated.error) return;
      handleReactionUpdated(updated);
      emitReaction(msg.chatId, updated, msg.isGroup);
    } catch (e) { console.error(e); }
  };

  const handleGroupUpdatedFromPanel = (updatedGroup) => {
    handleGroupUpdated(updatedGroup);
    emitGroupUpdated(updatedGroup._id, updatedGroup);
  };

  const handleLeaveGroup = (groupId, updatedGroupOrNull) => {
    if (updatedGroupOrNull) emitUserLeftGroup(groupId, updatedGroupOrNull);
    setGroups((p) => p.filter((g) => g._id !== groupId));
    setActiveChat(null); setShowProfile(false);
  };

  const handleChangePhoto = async () => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    inp.onchange = async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      try {
        const uploadData = await api.uploadFile(file);
        if (uploadData.error) throw new Error(uploadData.error);
        const updatedUser = await api.updateUserPhoto(currentUser._id, uploadData.secure_url);
        setCurrentUser(updatedUser);
        if (onUserUpdate) onUserUpdate(updatedUser);
      } catch (err) { addToast({ title: "Photo update failed", body: err.message }); }
    };
    inp.click();
  };

  const handleChangeName = async () => {
    const newName = window.prompt("Enter your new name:", currentUser.name);
    if (!newName || newName.trim() === "" || newName.trim() === currentUser.name) return;
    try {
      const updatedUser = await api.updateUserName(currentUser._id, newName.trim());
      if (updatedUser.error) throw new Error(updatedUser.error);
      setCurrentUser(updatedUser);
      if (onUserUpdate) onUserUpdate(updatedUser);
      addToast({ title: "Name updated", body: `Your name is now ${updatedUser.name}` });
    } catch (err) { addToast({ title: "Name update failed", body: err.message }); }
  };

  const handleSignOut = () => { disconnectUser(); onSignOut(); };



  const initiateCall = useCallback(async (type) => {
    if (!activeChat || isGroupChat(activeChat)) return;
    if (callStateRef.current !== "idle") return;

    setCallType(type);
    setCallPeer(activeChat);
    setCallState("outgoing");

    try {
      await startCall({
        calleeId: activeChat._id,
        callerName: currentUser.name,
        callerPhoto: currentUser.photoURL,
        callType: type,
      });
    } catch (err) {
      addToast({ title: "Call failed", body: "Could not access microphone/camera. Check permissions." });
      cleanup();
      setCallState("idle");
      setCallPeer(null);
    }
  }, [activeChat, currentUser, startCall, cleanup, addToast]);

  const handleAcceptCall = useCallback(async () => {
    const data = incomingRef.current;
    if (!data) return;
    const { callerId, callerName, callerPhoto, callType: ct } = data;
    setCallPeer({ _id: callerId, name: callerName, photoURL: callerPhoto });
    setCallState("in-call");
    setIncomingCallData(null);

    try {
      await acceptCall({ callerId, callType: ct });
    } catch (err) {
      addToast({ title: "Could not join call", body: "Check microphone/camera permissions." });
      emitCallRejectRef.current?.({ callerId, calleeId: currentUser._id });
      cleanup();
      setCallState("idle");
      setCallPeer(null);
    }
  }, [acceptCall, cleanup, addToast, currentUser._id]);

  const handleRejectCall = useCallback(() => {
    const data = incomingRef.current;
    if (!data) return;
    emitCallRejectRef.current?.({ callerId: data.callerId, calleeId: currentUser._id });
    setCallState("idle");
    setIncomingCallData(null);
  }, [currentUser._id]);

  const handleHangUp = useCallback(() => {
    const peerId = callPeerRef.current?._id || incomingRef.current?.callerId;
    if (peerId) emitCallEndRef.current?.({ targetId: peerId });
    cleanup();
    setCallState("idle");
    setCallPeer(null);
    setIncomingCallData(null);
  }, [cleanup]);

  const isInCall = callState === "in-call" || callState === "outgoing";

  return (
    <div className="flex h-full bg-background">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Lightbox src={lightboxImg} onClose={() => setLightboxImg(null)} />


      {callState === "incoming" && incomingCallData && (
        <IncomingCallModal
          caller={incomingCallData}
          callType={callType}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}


      {isInCall && (
        <CallModal
          callType={callType}
          callActive={callActive}
          remoteUser={callPeer}
          localStream={localStream}
          remoteStream={remoteStream}
          audioMuted={audioMuted}
          videoOff={videoOff}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onHangUp={handleHangUp}
        />
      )}


      <AsideBar user={currentUser} onSignOut={handleSignOut} onChangePhoto={handleChangePhoto} onChangeName={handleChangeName} />


      <ChatSidebar
        currentUser={currentUser}
        chats={chats}
        groups={groups}
        activeChat={activeChat}
        unreadCounts={unreadCounts}
        onSelectChat={startChatWith}
        onSelectGroup={selectGroup}
        onGroupCreated={handleGroupCreated}
        onSelectAI={selectAI}
        isAIActive={isAIActive}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={cn(
        "flex flex-1 overflow-hidden transition-all min-w-0",
        "pl-11 md:pl-[calc(2.75rem+18rem)]"
      )}>
        {isAIActive ? (
          <div className="flex flex-col flex-1 h-full overflow-hidden">
            <AIChat onBack={() => { setIsAIActive(false); setSidebarOpen(true); }} />
          </div>
        ) : activeChat ? (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0">
              <ChatHeader
                activeChat={activeChat}
                onToggleProfile={() => setShowProfile((p) => !p)}
                onBack={() => { setActiveChat(null); setSidebarOpen(true); }}
                typingUsers={typingUsers}
                currentUserId={currentUser._id}
                onStartVoiceCall={() => initiateCall("voice")}
                onStartVideoCall={() => initiateCall("video")}
                callInProgress={callState !== "idle"}
              />
              <MessageList
                messages={messages}
                currentUser={currentUser}
                activeChat={activeChat}
                uploading={uploading}
                onImageClick={setLightboxImg}
                onReact={handleReact}
              />
              <ChatInput
                input={input} setInput={setInput}
                onSend={handleSend} onFileUpload={handleFileUpload}
                uploading={uploading} sending={sending}
                activeChat={activeChat}
                replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
                currentUserId={currentUser._id}
                currentUserName={currentUser.name}
                emitTyping={emitTyping}
                emitStopTyping={emitStopTyping}
              />
            </div>

            {showProfile && (
              <ProfilePanel
                activeChat={activeChat}
                sharedMedia={sharedMedia}
                onImageClick={setLightboxImg}
                currentUser={currentUser}
                onGroupUpdated={handleGroupUpdatedFromPanel}
                onLeaveGroup={handleLeaveGroup}
                onClose={() => setShowProfile(false)}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex">
            <EmptyState onOpenSidebar={() => setSidebarOpen(true)} />
          </div>
        )}
      </div>

      <Watermark className="fixed bottom-0 left-0 right-0 z-[60] flex" />
    </div>
  );
}
