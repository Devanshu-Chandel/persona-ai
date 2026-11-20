const mongoose = require("mongoose");

const personaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "🤖" },
    systemPrompt: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    usesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Persona", personaSchema);