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
  } = {}
) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(API_URL);
    const socket = socketRef.current;

    const handleConnect = () => socket.emit("setup", userId);
    socket.on("connect", handleConnect);
    if (socket.connected) handleConnect();

    if (onMessage)          socket.on("receive_message",       onMessage);
    if (onGroupMessage)     socket.on("receive_group_message", onGroupMessage);
    if (onUserStatus)       socket.on("user_status",           onUserStatus);
    if (onUnreadUpdate)     socket.on("unread_update",         onUnreadUpdate);
    if (onGroupUpdated)     socket.on("group_updated",         onGroupUpdated);
    if (onReactionUpdated)  socket.on("reaction_updated",      onReactionUpdated);
    if (onPushNotification) socket.on("push_notification",     onPushNotification);

    return () => {
      socket.emit("disconnect_user", userId);
      socket.disconnect();
    };
  }, [userId]); 

  const sendMessage       = (p)       => socketRef.current?.emit("send_message",       p);
  const sendGroupMessage  = (p)       => socketRef.current?.emit("send_group_message", p);
  const joinGroup         = (gId)     => socketRef.current?.emit("join_group",         gId);
  const markRead          = (chatId)  => socketRef.current?.emit("mark_read",          { chatId, userId });
  const markGroupRead     = (chatId)  => socketRef.current?.emit("mark_group_read",    { chatId, userId });
  const emitGroupUpdated  = (gId, g)  => socketRef.current?.emit("group_updated",      { groupId: gId, group: g });
  const emitUserLeftGroup = (gId, g)  => socketRef.current?.emit("user_left_group",    { groupId: gId, userId, group: g });
  const disconnectUser    = ()        => socketRef.current?.emit("disconnect_user",    userId);
  const emitReaction      = (chatId, msg, isGroup) =>
    socketRef.current?.emit("message_reaction", { chatId, message: msg, isGroup });

  return {
    sendMessage, sendGroupMessage, joinGroup,
    markRead, markGroupRead,
    emitGroupUpdated, emitUserLeftGroup, disconnectUser,
    emitReaction,
  };
};
