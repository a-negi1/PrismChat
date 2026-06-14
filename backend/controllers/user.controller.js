const User = require("../models/User.model");
const Message = require("../models/Message.model");


const searchUsers = async (req, res) => {
  const { q } = req.query;
  try {
    const users = await User.find({
      $or: [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getUserChats = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("chats");
    if (!user) return res.json([]);

    const chatsWithLastMsg = await Promise.all(
      user.chats.map(async (chatUser) => {
        const chatId = [req.params.id, chatUser._id.toString()].sort().join("_");
        const lastMsg = await Message.findOne({ chatId }).sort({ createdAt: -1 });
        return { ...chatUser.toObject(), lastMsg };
      })
    );
    res.json(chatsWithLastMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const updateUserPhoto = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { photoURL: req.body.photoURL },
      { returnDocument: "after" }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUserName = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { returnDocument: "after" }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { searchUsers, getUserChats, updateUserPhoto, updateUserName };
