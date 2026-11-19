const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    persona: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Persona",
      required: true,
    },
    title: { type: String, default: "New chat" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);