require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth");
const personaRoutes = require("./routes/personas");
const conversationRoutes = require("./routes/conversations");

const missing = ["MONGO_URI", "JWT_SECRET"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing environment variables:", missing.join(", "));
  process.exit(1);
}

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { message: "Too many attempts, try again later" },
});

const app = express();

app.set("trust proxy", 1);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/personas", personaRoutes);
app.use("/api/conversations", conversationRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Persona AI API is running" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });