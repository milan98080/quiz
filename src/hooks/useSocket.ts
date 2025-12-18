'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

let socket: Socket | null = null;

export function useSocket(quizId: string) {
  const router = useRouter();

  useEffect(() => {
    if (!socket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
      socket = io(socketUrl);
    }

    socket.emit('join-quiz', quizId);

    socket.on('quiz-update', () => {
      router.refresh();
    });

    return () => {
      socket?.off('quiz-update');
    };
  }, [quizId, router]);

  return socket;
}
