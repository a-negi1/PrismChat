const dns = require("dns");
const mongoose = require("mongoose");


try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
