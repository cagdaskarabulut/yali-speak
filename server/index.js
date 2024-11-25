const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    // Add user to room tracking
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    // Notify all users in room about the new user
    const usersInRoom = Array.from(rooms.get(roomId));
    io.to(roomId).emit("users-in-room", usersInRoom);

    // Notify existing users to initiate connection with new user
    socket.to(roomId).emit("user-joined", socket.id);

    socket.on("signal", ({ userId, signal }) => {
      io.to(userId).emit("receive-signal", {
        userId: socket.id,
        signal,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit("users-in-room", Array.from(rooms.get(roomId)));
        }
      }
      socket.to(roomId).emit("user-left", socket.id);
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
