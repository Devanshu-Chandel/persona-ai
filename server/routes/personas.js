const express = require("express");
const mongoose = require("mongoose");
const Persona = require("../models/Persona");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  const personas = await Persona.find({
    $or: [{ createdBy: null }, { isPublic: true }, { createdBy: req.userId }],
  })
    .select("-systemPrompt")
    .sort({ createdAt: 1 });

  res.json({ personas });
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