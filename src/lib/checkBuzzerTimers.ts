'use server';

import { prisma } from './db';
import { processBuzzerAnswers } from './actions';

export async function checkBuzzerTimers(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.phase !== 'answering' || quiz.round !== 'buzzer') return { success: false };
  
  const buzzTimers = (quiz.buzzTimers as any) || {};
  const now = Date.now();
  
  // Check if 10-second buzz timer has expired (timerEndsAt from startBuzzerRound)
  const buzzWindowExpired = quiz.timerEndsAt && new Date(quiz.timerEndsAt).getTime() <= now;
  
  if (!buzzWindowExpired) {
    // Still within 10-second buzz window - don't process yet
    return { success: false };
  }
  
  // Buzz window expired - check if all buzzed teams' timers have expired or they've answered
  const pendingAnswers = (quiz.pendingBuzzerAnswers as any) || {};
  const allDone = quiz.buzzSequence.every(teamId => {
    return pendingAnswers[teamId] || (buzzTimers[teamId] && buzzTimers[teamId] <= now);
  });
  
  if (allDone) {
    return processBuzzerAnswers(quizId);
  }
  
  return { success: false };
}
