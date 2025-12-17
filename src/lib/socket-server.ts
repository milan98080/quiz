import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocket(server: HTTPServer) {
  if (io) return io;
  
  io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    socket.on('join-quiz', (quizId: string) => {
      socket.join(`quiz-${quizId}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function emitToQuiz(quizId: string, event: string, data: any) {
  if (io) {
    io.to(`quiz-${quizId}`).emit(event, data);
  }
}
