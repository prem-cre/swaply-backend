const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const usersRouter = require("./routes/users");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    io.to(roomId).emit("room_update", { message: `User ${socket.id} joined.` });
  });

  socket.on("send_message", (data) => {
    const messageData = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    io.to(data.roomId).emit("receive_message", messageData);
  });

  socket.on("private_message", (data) => {
    const { recipientId, message, sender } = data;
    const messageData = {
      sender,
      message,
      timestamp: new Date().toISOString(),
    };
    io.to(recipientId).emit("receive_private_message", messageData);
    console.log(`Private message from ${sender} to ${recipientId}: ${message}`);
  });

  socket.on("announcement", (data) => {
    const announcementData = {
      message: data.message,
      timestamp: new Date().toISOString(),
    };
    io.emit("receive_announcement", announcementData);
    console.log(`Announcement: ${data.message}`);
  });

  socket.on("typing", (data) => {
    const { roomId, user } = data;
    socket.to(roomId).emit("user_typing", { user });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use("/api/users", usersRouter);

server.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
