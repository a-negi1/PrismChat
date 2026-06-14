const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, required: true },
  name:     { type: String, required: true, trim: true },
  email:    {
    type: String, unique: true, required: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
  },
  photoURL: { type: String, default: "" },
  online:   { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  chats:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("User", UserSchema);
