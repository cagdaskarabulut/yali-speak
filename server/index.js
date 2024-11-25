const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
    
    socket.on('signal', ({ userId, signal }) => {
      io.to(userId).emit('receive-signal', {
        userId: socket.id,
        signal,
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      socket.to(roomId).emit('user-left', socket.id);
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});