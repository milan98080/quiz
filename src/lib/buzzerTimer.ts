'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';

function emitUpdate(quizId: string) {
  if (global.io) {
    global.io.to(`quiz-${quizId}`).emit('quiz-update');
  }
}

export async function handleBuzzerTimerExpiry(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.phase !== 'showing_answer') return;
  
  const nextQuestion = await prisma.buzzerQuestion.findFirst({
    where: { quizId, isAnswered: false },
    orderBy: { number: 'asc' },
  });
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { 
      phase: nextQuestion ? 'buzzing' : 'completed',
      currentQuestionId: nextQuestion?.id || null,
      buzzSequence: [],
      currentTeamId: null,
      timerEndsAt: nextQuestion ? new Date(Date.now() + 10000) : null
    },
  });
  
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
}
