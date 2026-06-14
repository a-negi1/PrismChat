const mongoose = require("mongoose");

const ReactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  emoji:  { type: String, required: true },
}, { _id: false });


const ReplyToSchema = new mongoose.Schema({
  _id:        { type: String },
  text:       { type: String, default: "" },
  image:      { type: String, default: "" },
  senderId:   { type: String },
  senderName: { type: String },
}, { _id: false });

const MessageSchema = new mongoose.Schema(
  {
    chatId:     { type: String, required: true, index: true },
    senderId:   { type: String, required: true },
    receiverId: { type: String, default: "" },
    senderName: { type: String },
    text:       { type: String, default: "" },
    image:      { type: String, default: "" },
    fileUrl:    { type: String, default: "" },
    fileType:   { type: String, default: "" },
    fileName:   { type: String, default: "" },
    isGroup:    { type: Boolean, default: false },
    readBy:     [{ type: String }],
    reactions:  [ReactionSchema],
    replyTo:    { type: ReplyToSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
