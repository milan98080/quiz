'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';

function emitUpdate(quizId: string) {
  if (global.io) {
    global.io.to(`quiz-${quizId}`).emit('quiz-update');
  }
}

export async function handleBuzzerAnswerTimerExpiry(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { teams: true } });
  if (!quiz || quiz.phase !== 'answering' || quiz.round !== 'buzzer') return;
  
  const question = await prisma.buzzerQuestion.findUnique({ where: { id: quiz.currentQuestionId! } });
  if (!question) return;
  
  const teamId = quiz.currentTeamId!;
  const buzzIndex = quiz.buzzSequence.indexOf(teamId);
  const isFirstBuzzer = buzzIndex === 0;
  
  // Deduct points for timeout
  const points = isFirstBuzzer ? -5 : -3;
  await prisma.team.update({ where: { id: teamId }, data: { score: { increment: points } } });
  
  // Pass to next in buzz sequence
  const currentIndex = quiz.buzzSequence.indexOf(teamId);
  const nextTeamId = quiz.buzzSequence[currentIndex + 1];
  
  if (nextTeamId) {
    const timerEndsAt = new Date(Date.now() + 20000);
    await prisma.quiz.update({
      where: { id: quizId },
      data: { currentTeamId: nextTeamId, phase: 'answering', timerEndsAt },
    });
  } else {
    // No more teams - show answer
    await prisma.buzzerQuestion.update({ where: { id: question.id }, data: { isAnswered: true } });
    const nextQuestion = await prisma.buzzerQuestion.findFirst({
      where: { quizId, isAnswered: false },
      orderBy: { number: 'asc' },
    });
    await prisma.quiz.update({
      where: { id: quizId },
      data: { 
        phase: nextQuestion ? 'showing_answer' : 'completed',
        currentQuestionId: quiz.currentQuestionId,
        buzzSequence: [],
        currentTeamId: null,
        timerEndsAt: new Date(Date.now() + 20000)
      },
    });
  }
  
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
}
