const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const messageRoutes = require("./routes/message.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/groups", require("./routes/group.routes"));
module.exports = app;
