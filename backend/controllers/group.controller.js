const Group   = require("../models/Group.model");
const Message = require("../models/Message.model");


const createGroup = async (req, res) => {
  const { name, adminId, memberIds } = req.body;
  try {
    
    const allMembers = [...new Set([adminId, ...memberIds])];
    const group = await Group.create({ name, admin: adminId, members: allMembers });
    const populated = await Group.findById(group._id).populate("members", "name email photoURL online lastSeen");
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.params.userId })
      .populate("members", "name email photoURL online lastSeen")
      .sort({ updatedAt: -1 });

    
    const withLastMsg = await Promise.all(
      groups.map(async (g) => {
        const lastMsg = await Message.findOne({ chatId: `group_${g._id}` }).sort({ createdAt: -1 });
        return { ...g.toObject(), lastMsg };
      })
    );
    res.json(withLastMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members", "name email photoURL online lastSeen");
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const renameGroup = async (req, res) => {
  const { name, requesterId } = req.body;
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== requesterId)
      return res.status(403).json({ error: "Only the admin can rename the group" });

    group.name = name.trim();
    await group.save();
    const populated = await Group.findById(group._id).populate("members", "name email photoURL online lastSeen");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const addMember = async (req, res) => {
  const { userId, requesterId } = req.body;
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== requesterId)
      return res.status(403).json({ error: "Only the admin can add members" });
    if (group.members.map(String).includes(userId))
      return res.status(400).json({ error: "User is already in the group" });

    group.members.push(userId);
    await group.save();
    const populated = await Group.findById(group._id).populate("members", "name email photoURL online lastSeen");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const leaveGroup = async (req, res) => {
  const { userId } = req.body;
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isAdmin = group.admin.toString() === userId;
    group.members = group.members.filter((m) => m.toString() !== userId);

    
    if (isAdmin && group.members.length > 0) {
      group.admin = group.members[0];
    }

    
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(group._id);
      await Message.deleteMany({ chatId: `group_${group._id}` });
      return res.json({ deleted: true });
    }

    await group.save();
    const populated = await Group.findById(group._id).populate("members", "name email photoURL online lastSeen");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const updateGroupPhoto = async (req, res) => {
  const { photoURL, requesterId } = req.body;
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== requesterId)
      return res.status(403).json({ error: "Only the admin can change the group photo" });

    group.photoURL = photoURL;
    await group.save();
    const populated = await Group.findById(group._id).populate("members", "name email photoURL online lastSeen");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createGroup, getUserGroups, getGroup, renameGroup, addMember, leaveGroup, updateGroupPhoto };