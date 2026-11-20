const express = require("express");
const mongoose = require("mongoose");
const Persona = require("../models/Persona");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

// what the browser gets to see: counts and "did I like it", never the list of who liked it
const shape = (p, userId) => {
  const likedBy = p.likedBy || [];
  return {
    _id: p._id,
    name: p.name,
    tagline: p.tagline,
    avatar: p.avatar,
    isPublic: p.isPublic,
    createdAt: p.createdAt,
    createdBy: p.createdBy?._id ?? null,
    creatorName: p.createdBy?.name ?? null,
    likesCount: likedBy.length,
    likedByMe: likedBy.some((id) => String(id) === String(userId)),
    usesCount: p.usesCount || 0,
  };
};

router.get("/", async (req, res) => {
  const personas = await Persona.find({
    $or: [{ createdBy: null }, { isPublic: true }, { createdBy: req.userId }],
  })
    .select("-systemPrompt")
    .populate("createdBy", "name")
    .sort({ createdAt: 1 })
    .lean();

  res.json({ personas: personas.map((p) => shape(p, req.userId)) });
});

router.post("/", async (req, res) => {
  const { name, tagline, avatar, systemPrompt, isPublic } = req.body;

  if (!name || !systemPrompt) {
    return res
      .status(400)
      .json({ message: "Name and instructions are required" });
  }
  if (typeof name !== "string" || typeof systemPrompt !== "string") {
    return res.status(400).json({ message: "Invalid input" });
  }
  if (
    name.length > 50 ||
    (tagline || "").length > 100 ||
    systemPrompt.length > 2000
  ) {
    return res.status(400).json({
      message: "Name max 50, tagline max 100, instructions max 2000 characters",
    });
  }

  const persona = await Persona.create({
    name,
    tagline,
    avatar: avatar?.trim().slice(0, 8) || undefined,
    systemPrompt,
    isPublic: Boolean(isPublic),
    createdBy: req.userId,
  });

  res.status(201).json({ persona });
});

// like / unlike (toggle)
router.post("/:id/like", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const persona = await Persona.findOne({
    _id: req.params.id,
    isPublic: true,
    createdBy: { $ne: null },
  });
  if (!persona) return res.status(404).json({ message: "Persona not found" });

  if (String(persona.createdBy) === String(req.userId)) {
    return res.status(400).json({ message: "You can't like your own persona" });
  }

  const already = persona.likedBy.some((id) => String(id) === String(req.userId));

  const updated = await Persona.findByIdAndUpdate(
    persona._id,
    already
      ? { $pull: { likedBy: req.userId } }
      : { $addToSet: { likedBy: req.userId } },
    { new: true }
  );

  res.json({ liked: !already, likesCount: updated.likedBy.length });
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const persona = await Persona.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.userId,
  });

  if (!persona) {
    return res.status(404).json({ message: "Persona not found" });
  }

  res.json({ message: "Deleted" });
});

module.exports = router;