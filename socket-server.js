const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const server = createServer();
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

// Expose io globally for actions to use
global.io = io;

server.listen(4000, '0.0.0.0', () => {
  console.log('Socket.IO server running on port 4000');
});

module.exports = io;
