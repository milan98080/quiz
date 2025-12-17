'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';

export async function createSnapshot(quizId: string, name: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      teams: true,
      domains: { include: { questions: true } },
      buzzerQuestions: true,
    },
  });

  if (!quiz) return { success: false, error: 'Quiz not found' };

  const snapshot = await prisma.snapshot.create({
    data: {
      quizId,
      name,
      data: JSON.stringify(quiz),
    },
  });

  return { success: true, snapshotId: snapshot.id };
}

export async function getSnapshots(quizId: string) {
  const snapshots = await prisma.snapshot.findMany({
    where: { quizId },
    orderBy: { createdAt: 'desc' },
  });
  return snapshots;
}

export async function restoreSnapshot(snapshotId: string) {
  const snapshot = await prisma.snapshot.findUnique({
    where: { id: snapshotId },
  });

  if (!snapshot) return { success: false, error: 'Snapshot not found' };

  const data = JSON.parse(snapshot.data as string);
  const quizId = snapshot.quizId;

  // Restore quiz state
  await prisma.quiz.update({
    where: { id: quizId },
    data: {
      status: data.status,
      round: data.round,
      phase: data.phase,
      currentTeamId: data.currentTeamId,
      currentQuestionId: data.currentQuestionId,
      selectedDomainId: data.selectedDomainId,
      timerEndsAt: data.timerEndsAt ? new Date(data.timerEndsAt) : null,
      buzzSequence: data.buzzSequence,
      domainSelectingTeam: data.domainSelectingTeam,
      questionsInDomain: data.questionsInDomain,
      usedDomains: data.usedDomains,
      totalDomainRounds: data.totalDomainRounds,
      completedDomainRounds: data.completedDomainRounds,
      domainIndex: data.domainIndex,
      questionSelectorIndex: data.questionSelectorIndex,
      answerTurnIndex: data.answerTurnIndex,
      pendingBuzzerAnswers: data.pendingBuzzerAnswers,
      buzzTimers: data.buzzTimers,
      lastRoundResults: data.lastRoundResults,
      lastDomainAnswer: data.lastDomainAnswer,
    },
  });

  // Restore team scores
  for (const team of data.teams) {
    await prisma.team.update({
      where: { id: team.id },
      data: { score: team.score },
    });
  }

  // Restore question states
  for (const domain of data.domains) {
    for (const question of domain.questions) {
      await prisma.question.update({
        where: { id: question.id },
        data: {
          isAnswered: question.isAnswered,
          selectedBy: question.selectedBy,
          passedFrom: question.passedFrom,
          attemptedBy: question.attemptedBy,
          correctAnswer: question.correctAnswer,
          optionsViewed: question.optionsViewed || false,
        },
      });
    }
  }

  // Restore buzzer question states
  for (const buzzerQ of data.buzzerQuestions) {
    await prisma.buzzerQuestion.update({
      where: { id: buzzerQ.id },
      data: {
        isAnswered: buzzerQ.isAnswered,
        passedFrom: buzzerQ.passedFrom,
      },
    });
  }

  return { success: true };
}

export async function deleteSnapshot(snapshotId: string) {
  await prisma.snapshot.delete({ where: { id: snapshotId } });
  return { success: true };
}

export async function createAutoSnapshot(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.status !== 'active') return { success: false };

  // Keep only last 10 auto-snapshots
  const autoSnapshots = await prisma.snapshot.findMany({
    where: { quizId, name: { startsWith: 'Auto:' } },
    orderBy: { createdAt: 'desc' },
  });

  if (autoSnapshots.length >= 10) {
    await prisma.snapshot.delete({ where: { id: autoSnapshots[9].id } });
  }

  const name = `Auto: ${new Date().toLocaleTimeString()}`;
  return createSnapshot(quizId, name);
}
