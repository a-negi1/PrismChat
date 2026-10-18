const { Server } = require("socket.io");
const User = require("../models/User.model");
const Message = require("../models/Message.model");

let io;

const initSocket = (server) => {
  const socketOrigins = [
    "http://localhost:5173",
    "https://prism-chat-5k4w.vercel.app",
    ...(process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim())
      : []),
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: socketOrigins,
      credentials: true,
    },

    transports: ["websocket", "polling"],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {


    socket.on("setup", async (userId) => {
      socket.join(userId);
      const user = await User.findByIdAndUpdate(
        userId,
        { online: true },
        { returnDocument: "after" }
      );
      if (user) socket.broadcast.emit("user_status", { userId: user._id, online: true });
    });


    socket.on("send_message", async (data) => {
      const {
        senderId, receiverId, text, image, senderName,
        fileUrl, fileType, fileName, replyTo,
      } = data;

      const chatId = [senderId, receiverId].sort().join("_");

      const newMsg = await Message.create({
        chatId, senderId, receiverId, senderName,
        text: text || "",
        image: image || "",
        fileUrl: fileUrl || "",
        fileType: fileType || "",
        fileName: fileName || "",
        readBy: [senderId],
        reactions: [],
        replyTo: replyTo || null,
      });

      await User.findByIdAndUpdate(senderId, { $addToSet: { chats: receiverId } });
      await User.findByIdAndUpdate(receiverId, { $addToSet: { chats: senderId } });

      io.to(receiverId).emit("receive_message", newMsg);
      io.to(senderId).emit("receive_message", newMsg);


      io.to(receiverId).emit("push_notification", {
        title: senderName || "New message",
        body: text || (fileType === "image" ? "📷 Image" : fileType === "video" ? "🎥 Video" : "📎 File"),
        chatId,
        senderId,
      });

      const unreadCount = await Message.countDocuments({
        chatId,
        senderId: { $ne: receiverId },
        readBy: { $ne: receiverId },
      });
      io.to(receiverId).emit("unread_update", { chatId, senderId, count: unreadCount });
    });

    socket.on("mark_read", async ({ chatId, userId }) => {
      await Message.updateMany(
        { chatId, senderId: { $ne: userId }, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      const otherId = chatId.replace(userId, "").replace("_", "");
      io.to(otherId).emit("messages_read", { chatId, readBy: userId });
      socket.emit("unread_update", { chatId, count: 0 });
    });


    socket.on("message_reaction", ({ chatId, message, isGroup }) => {
      if (isGroup) {
        io.to(chatId).emit("reaction_updated", message);
      } else {
        chatId.split("_").forEach((id) => io.to(id).emit("reaction_updated", message));
      }
    });


    socket.on("join_group", (groupId) => {
      socket.join(`group_${groupId}`);
    });


    socket.on("send_group_message", async (data) => {
      const {
        senderId, groupId, senderName, text, image,
        fileUrl, fileType, fileName, replyTo,
      } = data;

      const chatId = `group_${groupId}`;

      const newMsg = await Message.create({
        chatId, senderId, receiverId: "", senderName,
        text: text || "",
        image: image || "",
        fileUrl: fileUrl || "",
        fileType: fileType || "",
        fileName: fileName || "",
        isGroup: true,
        readBy: [senderId],
        reactions: [],
        replyTo: replyTo || null,
      });

      io.to(chatId).emit("receive_group_message", newMsg);

      io.to(chatId).emit("push_notification", {
        title: `${senderName} in group`,
        body: text || (fileType === "image" ? "📷 Image" : fileType === "video" ? "🎥 Video" : "📎 File"),
        chatId,
        senderId,
        isGroup: true,
        groupId,
      });

      io.to(chatId).emit("group_unread_update", { chatId, senderId });
    });

    socket.on("mark_group_read", async ({ chatId, userId }) => {
      await Message.updateMany(
        { chatId, senderId: { $ne: userId }, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      socket.emit("unread_update", { chatId, count: 0 });
    });


    socket.on("group_updated", ({ groupId, group }) => {
      io.to(`group_${groupId}`).emit("group_updated", group);
    });

    socket.on("user_left_group", ({ groupId, userId, group }) => {
      io.to(`group_${groupId}`).emit("group_updated", group);
      socket.leave(`group_${groupId}`);
    });


    socket.on("typing", ({ senderId, senderName, receiverId, groupId }) => {
      if (groupId) {

        socket.to(`group_${groupId}`).emit("typing", { senderId, senderName, groupId });
      } else if (receiverId) {

        io.to(receiverId).emit("typing", { senderId, senderName, receiverId });
      }
    });

    socket.on("stop_typing", ({ senderId, receiverId, groupId }) => {
      if (groupId) {
        socket.to(`group_${groupId}`).emit("stop_typing", { senderId, groupId });
      } else if (receiverId) {
        io.to(receiverId).emit("stop_typing", { senderId, receiverId });
      }
    });


    socket.on("disconnect_user", async (userId) => {
      const user = await User.findByIdAndUpdate(
        userId,
        { online: false, lastSeen: new Date() },
        { returnDocument: "after" }
      );
      if (user) {
        io.emit("user_status", {
          userId: user._id,
          online: false,
          lastSeen: user.lastSeen,
        });
      }
    });


    socket.on("call:initiate", ({ callerId, callerName, callerPhoto, calleeId, callType }) => {
      io.to(calleeId).emit("call:incoming", { callerId, callerName, callerPhoto, calleeId, callType });
    });


    socket.on("call:accepted", ({ callerId, calleeId }) => {
      io.to(callerId).emit("call:accepted", { calleeId });
    });


    socket.on("call:reject", ({ callerId, calleeId }) => {
      io.to(callerId).emit("call:rejected", { calleeId });
    });


    socket.on("call:offer", ({ callerId, calleeId, offer, callType }) => {
      io.to(calleeId).emit("call:offer", { offer, callType, callerId });
    });


    socket.on("call:answer", ({ callerId, calleeId, answer }) => {
      io.to(callerId).emit("call:answer", { answer, calleeId });
    });


    socket.on("call:ice-candidate", ({ targetId, candidate }) => {
      io.to(targetId).emit("call:ice-candidate", { candidate });
    });


    socket.on("call:end", ({ targetId }) => {
      io.to(targetId).emit("call:ended");
    });


    socket.on("call:busy", ({ callerId }) => {
      io.to(callerId).emit("call:busy");
    });
  });
};

const getIO = () => io;
module.exports = { initSocket, getIO };
