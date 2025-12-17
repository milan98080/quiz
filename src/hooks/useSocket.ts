'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

let socket: Socket | null = null;

export function useSocket(quizId: string) {
  const router = useRouter();

  useEffect(() => {
    if (!socket) {
      socket = io({ path: '/api/socket' });
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
