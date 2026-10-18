import { useEffect, useRef } from "react";
import io from "socket.io-client";
import { API_URL } from "../services/api";

export const useSocket = (
  userId,
  {
    onMessage,
    onGroupMessage,
    onUserStatus,
    onUnreadUpdate,
    onGroupUpdated,
    onReactionUpdated,
    onPushNotification,
    onTyping,
    onStopTyping,

    onCallIncoming,
    onCallAccepted,
    onCallRejected,
    onCallOffer,
    onCallAnswer,
    onCallIceCandidate,
    onCallEnded,
    onCallBusy,
  } = {}
) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(API_URL, {

      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    const socket = socketRef.current;

    const handleConnect = () => socket.emit("setup", userId);
    socket.on("connect", handleConnect);
    if (socket.connected) handleConnect();

    if (onMessage) socket.on("receive_message", onMessage);
    if (onGroupMessage) socket.on("receive_group_message", onGroupMessage);
    if (onUserStatus) socket.on("user_status", onUserStatus);
    if (onUnreadUpdate) socket.on("unread_update", onUnreadUpdate);
    if (onGroupUpdated) socket.on("group_updated", onGroupUpdated);
    if (onReactionUpdated) socket.on("reaction_updated", onReactionUpdated);
    if (onPushNotification) socket.on("push_notification", onPushNotification);
    if (onTyping) socket.on("typing", onTyping);
    if (onStopTyping) socket.on("stop_typing", onStopTyping);


    if (onCallIncoming) socket.on("call:incoming", onCallIncoming);
    if (onCallAccepted) socket.on("call:accepted", onCallAccepted);
    if (onCallRejected) socket.on("call:rejected", onCallRejected);
    if (onCallOffer) socket.on("call:offer", onCallOffer);
    if (onCallAnswer) socket.on("call:answer", onCallAnswer);
    if (onCallIceCandidate) socket.on("call:ice-candidate", onCallIceCandidate);
    if (onCallEnded) socket.on("call:ended", onCallEnded);
    if (onCallBusy) socket.on("call:busy", onCallBusy);

    return () => {
      socket.emit("disconnect_user", userId);
      socket.disconnect();
    };
  }, [userId]);

  const sendMessage = (p) => socketRef.current?.emit("send_message", p);
  const sendGroupMessage = (p) => socketRef.current?.emit("send_group_message", p);
  const joinGroup = (gId) => socketRef.current?.emit("join_group", gId);
  const markRead = (chatId) => socketRef.current?.emit("mark_read", { chatId, userId });
  const markGroupRead = (chatId) => socketRef.current?.emit("mark_group_read", { chatId, userId });
  const emitGroupUpdated = (gId, g) => socketRef.current?.emit("group_updated", { groupId: gId, group: g });
  const emitUserLeftGroup = (gId, g) => socketRef.current?.emit("user_left_group", { groupId: gId, userId, group: g });
  const disconnectUser = () => socketRef.current?.emit("disconnect_user", userId);
  const emitReaction = (chatId, msg, isGroup) =>
    socketRef.current?.emit("message_reaction", { chatId, message: msg, isGroup });
  const emitTyping = (p) => socketRef.current?.emit("typing", p);
  const emitStopTyping = (p) => socketRef.current?.emit("stop_typing", p);


  const emitCallInitiate = (p) => socketRef.current?.emit("call:initiate", p);
  const emitCallAccepted = (p) => socketRef.current?.emit("call:accepted", p);
  const emitCallReject = (p) => socketRef.current?.emit("call:reject", p);
  const emitCallOffer = (p) => socketRef.current?.emit("call:offer", p);
  const emitCallAnswer = (p) => socketRef.current?.emit("call:answer", p);
  const emitCallIceCandidate = (p) => socketRef.current?.emit("call:ice-candidate", p);
  const emitCallEnd = (p) => socketRef.current?.emit("call:end", p);
  const emitCallBusy = (p) => socketRef.current?.emit("call:busy", p);

  return {
    sendMessage, sendGroupMessage, joinGroup,
    markRead, markGroupRead,
    emitGroupUpdated, emitUserLeftGroup, disconnectUser,
    emitReaction, emitTyping, emitStopTyping,

    emitCallInitiate, emitCallAccepted, emitCallReject,
    emitCallOffer, emitCallAnswer, emitCallIceCandidate,
    emitCallEnd, emitCallBusy,

    socketRef,
  };
};
