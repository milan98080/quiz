const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require('express');

const app = express();
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-quiz', (quizId) => {
    socket.join(`quiz-${quizId}`);
    console.log(`Socket ${socket.id} joined quiz ${quizId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// HTTP endpoint to emit events from Next.js
app.post('/emit', (req, res) => {
  const { quizId, event, data } = req.body;
  io.to(`quiz-${quizId}`).emit(event, data);
  console.log(`Emitted ${event} to quiz-${quizId}`);
  res.json({ success: true });
});

server.listen(4000, '0.0.0.0', () => {
  console.log('Socket.IO server running on port 4000');
});

module.exports = io;
