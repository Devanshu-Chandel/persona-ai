require("dotenv").config();
const mongoose = require("mongoose");
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const withMessages = await Message.distinct("conversation");
    const result = await Conversation.deleteMany({
      _id: { $nin: withMessages },
    });
    console.log(`Deleted ${result.deletedCount} empty conversations`);
  } catch (err) {
    console.error("Cleanup failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();