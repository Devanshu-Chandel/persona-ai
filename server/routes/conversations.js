const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Persona = require("../models/Persona");
const auth = require("../middleware/auth");
const { generateReply } = require("../services/ai");

const router = express.Router();
router.use(auth);

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { message: "Too many messages, slow down a little" },
});

const findOwned = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return Conversation.findOne({ _id: req.params.id, user: req.userId }).populate(
    "persona"
  );
};

// list my conversations
router.get("/", async (req, res) => {
  const conversations = await Conversation.find({ user: req.userId })
    .populate("persona", "name avatar")
    .sort({ updatedAt: -1 });
  res.json({ conversations });
});

// start a conversation with a persona
router.post("/", async (req, res) => {
  const { personaId } = req.body;
  if (!mongoose.isValidObjectId(personaId)) {
    return res.status(400).json({ message: "Valid personaId required" });
  }

  const persona = await Persona.findOne({
    _id: personaId,
    $or: [{ createdBy: null }, { isPublic: true }, { createdBy: req.userId }],
  });
  if (!persona) return res.status(404).json({ message: "Persona not found" });

  const conversation = await Conversation.create({
    user: req.userId,
    persona: persona._id,
  });
  res.status(201).json({ conversation });
});

// get all messages of one conversation
router.get("/:id/messages", async (req, res) => {
  const conversation = await findOwned(req);
  if (!conversation) return res.status(404).json({ message: "Not found" });

  const messages = await Message.find({ conversation: conversation._id }).sort({
    createdAt: 1,
  });
  res.json({ messages });
});

// send a message and get the persona's reply
router.post("/:id/messages", chatLimiter, async (req, res) => {
  const text = (req.body.content || "").trim();
  if (!text) return res.status(400).json({ message: "Message is empty" });
  if (text.length > 4000) {
    return res.status(400).json({ message: "Message is too long" });
  }

  const conversation = await findOwned(req);
  if (!conversation) return res.status(404).json({ message: "Not found" });
  if (!conversation.persona) {
    return res.status(410).json({ message: "This persona no longer exists" });
  }

  const userMessage = await Message.create({
    conversation: conversation._id,
    role: "user",
    content: text,
  });

  const recent = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: -1, _id: -1 })
    .limit(20);
  const history = recent.reverse();
  while (history.length && history[0].role !== "user") history.shift();

   let reply;
  try {
    reply = await generateReply(conversation.persona.systemPrompt, history);
  } catch (err) {
    console.error("AI call failed:", err);   // <-- add this line
    await Message.findByIdAndDelete(userMessage._id);
        const busy = err.status === 429 || err.status === 503;
    return res.status(busy ? 429 : 502).json({
      message: busy
        ? "The AI is busy right now. Try again in a minute."
        : "The AI could not reply. Please try again.",
    });
  }

  const assistantMessage = await Message.create({
    conversation: conversation._id,
    role: "assistant",
    content: reply,
  }
  
);
  // first reply of this chat: count it as one use of the persona (not for the creator's own chats)
  if (
    conversation.title === "New chat" &&
    String(conversation.persona.createdBy) !== String(req.userId)
  ) {
    await Persona.updateOne(
      { _id: conversation.persona._id },
      { $inc: { usesCount: 1 } }
    );
  } 

  const title =
    conversation.title === "New chat" ? text.slice(0, 40) : conversation.title;
  await Conversation.updateOne({ _id: conversation._id }, { title });

  res.status(201).json({ userMessage, assistantMessage, title });
});

// delete a conversation and its messages
router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  const deleted = await Conversation.findOneAndDelete({
    _id: req.params.id,
    user: req.userId,
  });
  if (!deleted) return res.status(404).json({ message: "Not found" });

  await Message.deleteMany({ conversation: deleted._id });
  res.json({ message: "Deleted" });
});

module.exports = router;