const Message = require("../models/Message.model");
const User    = require("../models/User.model");
const Group   = require("../models/Group.model");

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markMessagesRead = async (req, res) => {
  const { userId } = req.body;
  try {
    await Message.updateMany(
      { chatId: req.params.chatId, senderId: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUnreadCounts = async (req, res) => {
  const { userId } = req.params;
  try {
    const unread = await Message.aggregate([
      {
        $match: {
          senderId: { $ne: userId },
          readBy:   { $ne: userId },
          chatId:   { $regex: userId },
        },
      },
      { $group: { _id: "$chatId", count: { $sum: 1 } } },
    ]);
    const result = {};
    unread.forEach(({ _id, count }) => { result[_id] = count; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/messages/:messageId/react
 * Body: { userId, emoji }
 * Toggle logic: if user already reacted with same emoji → remove it.
 * If user reacted with different emoji → replace it.
 * If no reaction yet → add it.
 */
const reactToMessage = async (req, res) => {
  const { userId, emoji } = req.body;
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    const existingIdx = msg.reactions.findIndex((r) => r.userId === userId);

    if (existingIdx > -1) {
      if (msg.reactions[existingIdx].emoji === emoji) {
        // Same emoji → remove (toggle off)
        msg.reactions.splice(existingIdx, 1);
      } else {
        // Different emoji → replace
        msg.reactions[existingIdx].emoji = emoji;
      }
    } else {
      // No reaction yet → add
      msg.reactions.push({ userId, emoji });
    }

    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const searchMessages = async (req, res) => {
  const { userId } = req.params;
  const { q } = req.query;
  if (!q?.trim()) return res.json([]);

  try {
    const user  = await User.findById(userId);
    if (!user) return res.json([]);

    const groups = await Group.find({ members: userId }).select("_id name");
    const dmChatIds = user.chats.map((c) =>
      [userId, c.toString()].sort().join("_")
    );
    const groupChatIds = groups.map((g) => `group_${g._id}`);
    const allChatIds = [...dmChatIds, ...groupChatIds];

    if (!allChatIds.length) return res.json([]);

    const messages = await Message.find({
      chatId: { $in: allChatIds },
      text: { $regex: q.trim(), $options: "i" },
    })
      .sort({ createdAt: -1 })
      .limit(40);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMessages, markMessagesRead, getUnreadCounts, reactToMessage, searchMessages };
