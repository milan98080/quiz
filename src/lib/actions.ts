'use server';

import { prisma } from './db';
import { getSession } from './session';
import { revalidatePath } from 'next/cache';

async function emitUpdate(quizId: string) {
  try {
    await fetch('http://localhost:4000/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, event: 'quiz-update', data: {} })
    });
  } catch (error) {
    console.error('Failed to emit update:', error);
  }
}

// Quiz Actions
export async function createQuiz() {
  const quiz = await prisma.quiz.create({ data: {} });
  const session = await getSession();
  session.quizId = quiz.id;
  session.isHost = true;
  await session.save();
  return { success: true, quizId: quiz.id };
}

export async function hostLogin(password: string) {
  if (password !== process.env.HOST_PASSWORD) {
    return { success: false, error: 'Invalid password' };
  }
  const session = await getSession();
  session.isHost = true;
  await session.save();
  return { success: true };
}

export async function getQuizData(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      teams: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] },
      domains: { include: { questions: { orderBy: { number: 'asc' } } } },
      buzzerQuestions: { orderBy: { number: 'asc' } },
    },
  });
  return quiz ? JSON.parse(JSON.stringify(quiz)) : null;
}

// Team Actions
export async function createTeam(quizId: string, teamName: string) {
  const existingCount = await prisma.team.count({ where: { quizId } });
  const team = await prisma.team.create({
    data: { name: teamName, quizId, sequence: existingCount },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true, teamId: team.id };
}

export async function joinTeam(quizId: string, teamId: string, captainName: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (team?.captainName) {
    return { success: false, error: 'Team already has a captain' };
  }
  
  await prisma.team.update({
    where: { id: teamId },
    data: { captainName },
  });
  
  const session = await getSession();
  session.quizId = quizId;
  session.teamId = teamId;
  await session.save();
  revalidatePath(`/quiz/${quizId}`);
  return { success: true };
}

// Domain Actions
export async function createDomain(quizId: string, domainName: string) {
  const domain = await prisma.domain.create({
    data: { name: domainName, quizId },
  });
  revalidatePath(`/quiz/${quizId}`);
  return { success: true, domainId: domain.id };
}

export async function createQuestion(
  domainId: string,
  text: string,
  answer: string,
  options: string[]
) {
  const count = await prisma.question.count({ where: { domainId } });
  const question = await prisma.question.create({
    data: { domainId, number: count + 1, text, answer, options },
  });
  const domain = await prisma.domain.findUnique({ where: { id: domainId }, include: { quiz: true } });
  if (domain) {
    revalidatePath(`/quiz/${domain.quizId}/host`);
    emitUpdate(domain.quizId);
  }
  return { success: true, questionId: question.id };
}

export async function createBuzzerQuestion(
  quizId: string,
  text: string,
  answer: string,
  options: string[]
) {
  const count = await prisma.buzzerQuestion.count({ where: { quizId } });
  const question = await prisma.buzzerQuestion.create({
    data: { quizId, number: count + 1, text, answer, options },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  emitUpdate(quizId);
  return { success: true, questionId: question.id };
}

export async function deleteTeam(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  await prisma.team.delete({ where: { id: teamId } });
  if (team) {
    revalidatePath(`/quiz/${team.quizId}/host`);
    revalidatePath(`/quiz/${team.quizId}/team`);
    emitUpdate(team.quizId);
  }
  return { success: true };
}

export async function disconnectTeamCaptain(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { success: false, error: 'Team not found' };
  
  await prisma.team.update({
    where: { id: teamId },
    data: { captainName: null },
  });
  
  revalidatePath(`/quiz/${team.quizId}/host`);
  revalidatePath(`/quiz/${team.quizId}/team`);
  emitUpdate(team.quizId);
  return { success: true };
}

export async function deleteDomain(domainId: string) {
  const domain = await prisma.domain.findUnique({ where: { id: domainId } });
  await prisma.domain.delete({ where: { id: domainId } });
  if (domain) {
    revalidatePath(`/quiz/${domain.quizId}/host`);
    emitUpdate(domain.quizId);
  }
  return { success: true };
}

export async function deleteQuestion(questionId: string) {
  const question = await prisma.question.findUnique({ 
    where: { id: questionId },
    include: { domain: true }
  });
  await prisma.question.delete({ where: { id: questionId } });
  if (question) {
    revalidatePath(`/quiz/${question.domain.quizId}/host`);
    emitUpdate(question.domain.quizId);
  }
  return { success: true };
}

export async function deleteBuzzerQuestion(questionId: string) {
  const question = await prisma.buzzerQuestion.findUnique({ where: { id: questionId } });
  await prisma.buzzerQuestion.delete({ where: { id: questionId } });
  if (question) {
    revalidatePath(`/quiz/${question.quizId}/host`);
    emitUpdate(question.quizId);
  }
  return { success: true };
}

export async function updateTeam(teamId: string, name: string) {
  const team = await prisma.team.update({
    where: { id: teamId },
    data: { name },
  });
  revalidatePath(`/quiz/${team.quizId}/host`);
  revalidatePath(`/quiz/${team.quizId}/team`);
  emitUpdate(team.quizId);
  return { success: true };
}

export async function updateDomain(domainId: string, name: string) {
  const domain = await prisma.domain.update({
    where: { id: domainId },
    data: { name },
  });
  revalidatePath(`/quiz/${domain.quizId}/host`);
  emitUpdate(domain.quizId);
  return { success: true };
}

export async function updateQuestion(
  questionId: string,
  text: string,
  answer: string,
  options: string[]
) {
  const question = await prisma.question.update({
    where: { id: questionId },
    data: { text, answer, options },
    include: { domain: true },
  });
  revalidatePath(`/quiz/${question.domain.quizId}/host`);
  emitUpdate(question.domain.quizId);
  return { success: true };
}

export async function updateBuzzerQuestion(
  questionId: string,
  text: string,
  answer: string,
  options: string[]
) {
  const question = await prisma.buzzerQuestion.update({
    where: { id: questionId },
    data: { text, answer, options },
  });
  revalidatePath(`/quiz/${question.quizId}/host`);
  emitUpdate(question.quizId);
  return { success: true };
}

// Game Actions
export async function startDomainRound(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { teams: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] }, domains: true },
  });
  const firstTeamId = quiz?.teams[0]?.id || null;
  const teamCount = quiz?.teams.length || 1;
  const totalDomains = quiz?.domains.length || 0;
  const totalDomainRounds = Math.floor(totalDomains / teamCount) * teamCount;
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { 
      status: 'active', 
      round: 'domain', 
      phase: 'selecting_domain', 
      currentTeamId: firstTeamId,
      domainSelectingTeam: 0,
      questionsInDomain: 0,
      totalDomainRounds,
      completedDomainRounds: 0,
      domainIndex: 0,
      questionSelectorIndex: 0,
      answerTurnIndex: 0
    },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function startBuzzerRound(quizId: string) {
  const firstQuestion = await prisma.buzzerQuestion.findFirst({
    where: { quizId, isAnswered: false },
    orderBy: { number: 'asc' },
  });
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { 
      status: 'active',
      round: 'buzzer', 
      phase: 'buzzing',
      currentQuestionId: firstQuestion?.id,
      buzzSequence: [],
      currentTeamId: null,
      timerEndsAt: new Date(Date.now() + 10000),
      pendingBuzzerAnswers: {},
      buzzTimers: {},
      lastRoundResults: {}
    },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function pauseQuiz(quizId: string) {
  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: 'paused', timerEndsAt: null },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function resumeQuiz(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  let timerEndsAt = null;
  
  if (quiz?.round === 'domain' && (quiz.phase === 'answering' || quiz.phase === 'answering_with_options')) {
    timerEndsAt = new Date(Date.now() + 60000);
  } else if (quiz?.round === 'buzzer' && quiz.phase === 'answering') {
    timerEndsAt = new Date(Date.now() + 20000);
  } else if (quiz?.phase === 'showing_answer') {
    timerEndsAt = new Date(Date.now() + 20000);
  }
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: 'active', timerEndsAt },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function pauseBuzzerRound(quizId: string) {
  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: 'paused', timerEndsAt: null },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function resumeBuzzerRound(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  let timerEndsAt = null;
  
  if (quiz?.phase === 'answering') {
    const buzzIndex = quiz.buzzSequence.indexOf(quiz.currentTeamId!);
    const isFirstBuzzer = buzzIndex === 0;
    timerEndsAt = new Date(Date.now() + (isFirstBuzzer ? 30000 : 20000));
  } else if (quiz?.phase === 'showing_answer') {
    timerEndsAt = new Date(Date.now() + 20000);
  }
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: 'active', timerEndsAt },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function handleBuzzTimerExpiry(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || (quiz.phase !== 'buzzing' && quiz.phase !== 'answering')) return { success: false };
  
  // If someone buzzed, process their answers
  if (quiz.buzzSequence.length > 0) {
    return processBuzzerAnswers(quizId);
  }
  
  // No one buzzed - show answer
  await prisma.buzzerQuestion.update({ where: { id: quiz.currentQuestionId! }, data: { isAnswered: true } });
  
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
      timerEndsAt: new Date(Date.now() + 20000),
      pendingBuzzerAnswers: {},
      lastRoundResults: {}
    },
  });
  
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function buzz(quizId: string, teamId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || (quiz.phase !== 'buzzing' && quiz.phase !== 'answering')) return { success: false };
  if (quiz.buzzSequence.includes(teamId)) return { success: false };
  
  const buzzSequence = [...quiz.buzzSequence, teamId];
  const isFirstBuzz = buzzSequence.length === 1;
  
  // Set 20-second timer for this team
  const buzzTimers = (quiz.buzzTimers as any) || {};
  buzzTimers[teamId] = Date.now() + 20000;
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { 
      buzzSequence,
      buzzTimers,
      phase: isFirstBuzz ? 'answering' : quiz.phase
    },
  });
  
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function submitBuzzerAnswer(
  quizId: string,
  teamId: string,
  questionId: string,
  answer: string
) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  const question = await prisma.buzzerQuestion.findUnique({ where: { id: questionId } });
  if (!question || !quiz || !quiz.buzzSequence.includes(teamId)) return { success: false };

  // Check if team already submitted
  const pendingAnswers = (quiz.pendingBuzzerAnswers as any) || {};
  if (pendingAnswers[teamId]) return { success: false, error: 'Already submitted' };

  const isCorrect = answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
  const buzzIndex = quiz.buzzSequence.indexOf(teamId);
  const isFirstBuzzer = buzzIndex === 0;
  const points = isCorrect ? (isFirstBuzzer ? 10 : 5) : (isFirstBuzzer ? -10 : -5);
  
  // Queue the answer - always wait for buzz timer or all team timers to expire
  pendingAnswers[teamId] = { answer, isCorrect, points };
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { pendingBuzzerAnswers: pendingAnswers }
  });

  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true, queued: true };
}

export async function processBuzzerAnswers(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || !quiz.currentQuestionId) return { success: false };
  
  const pendingAnswers = (quiz.pendingBuzzerAnswers as any) || {};
  const question = await prisma.buzzerQuestion.findUnique({ where: { id: quiz.currentQuestionId } });
  if (!question) return { success: false };
  
  // Process answers in buzz order - stop at first correct answer
  let foundCorrect = false;
  const results: any = {};
  
  for (let i = 0; i < quiz.buzzSequence.length; i++) {
    const teamId = quiz.buzzSequence[i];
    const teamAnswer = pendingAnswers[teamId];
    const isFirstBuzzer = i === 0;
    
    if (foundCorrect) {
      // Someone already got it right - no points for remaining teams
      break;
    }
    
    if (teamAnswer) {
      // Team submitted answer - use points already calculated
      results[teamId] = teamAnswer;
      await prisma.team.update({ 
        where: { id: teamId }, 
        data: { score: { increment: teamAnswer.points } } 
      });
      if (teamAnswer.isCorrect) {
        foundCorrect = true;
      }
    } else {
      // Team didn't answer - timeout penalty
      const points = isFirstBuzzer ? -10 : -5;
      results[teamId] = { answer: '', isCorrect: false, points, timeout: true };
      await prisma.team.update({ 
        where: { id: teamId }, 
        data: { score: { increment: points } } 
      });
    }
  }
  
  // Mark question as answered
  await prisma.buzzerQuestion.update({ where: { id: quiz.currentQuestionId }, data: { isAnswered: true } });
  
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
      timerEndsAt: new Date(Date.now() + 20000),
      lastRoundResults: results,
      pendingBuzzerAnswers: {},
      buzzTimers: {}
    },
  });

  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function submitAnswer(
  quizId: string,
  teamId: string,
  questionId: string,
  answer: string,
  usedOptions: boolean
) {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return { success: false, error: 'Question not found' };

  const isCorrect = answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
  let points = 0;

  if (isCorrect) {
    points = usedOptions ? 5 : 10;
    await prisma.question.update({
      where: { id: questionId },
      data: { isAnswered: true },
    });
  }

  await prisma.team.update({
    where: { id: teamId },
    data: { score: { increment: points } },
  });

  // Move to next team
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { teams: true },
  });
  const currentIndex = quiz?.teams.findIndex(t => t.id === teamId) ?? -1;
  const nextIndex = (currentIndex + 1) % (quiz?.teams.length ?? 1);
  const nextTeamId = quiz?.teams[nextIndex]?.id || null;

  await prisma.quiz.update({
    where: { id: quizId },
    data: { currentTeamId: nextTeamId },
  });

  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true, isCorrect, points };
}

export async function updateScore(teamId: string, points: number) {
  await prisma.team.update({
    where: { id: teamId },
    data: { score: { increment: points } },
  });
  revalidatePath(`/quiz/*`);
  return { success: true };
}

export async function selectDomain(quizId: string, domainId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { teams: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] } } });
  const domainIndex = quiz?.domainIndex || 0;
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { 
      selectedDomainId: domainId, 
      phase: 'selecting_question',
      questionsInDomain: 0,
      usedDomains: { push: domainId },
      questionSelectorIndex: domainIndex,
      answerTurnIndex: domainIndex
    },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function selectQuestion(quizId: string, questionId: string, teamId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { teams: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] } } });
  const selectorIndex = quiz?.questionSelectorIndex || 0;
  const expectedTeamId = quiz?.currentTeamId || quiz?.teams[selectorIndex]?.id;
  
  console.log('[SELECT_QUESTION]', {
    questionSelectorIndex: quiz?.questionSelectorIndex,
    selectorIndex,
    expectedTeamId,
    teamId,
    teamNames: quiz?.teams.map(t => t.name)
  });
  
  if (teamId !== expectedTeamId) {
    return { success: false, error: 'Not your turn to select a question' };
  }
  
  const timerEndsAt = new Date(Date.now() + 60000);
  
  await prisma.quiz.update({
    where: { id: quizId },
    data: { currentQuestionId: questionId, phase: 'answering', timerEndsAt, currentTeamId: teamId, answerTurnIndex: selectorIndex },
  });
  await prisma.question.update({
    where: { id: questionId },
    data: { selectedBy: teamId, attemptedBy: { push: teamId } },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function showOptions(quizId: string, questionId: string) {
  await prisma.question.update({
    where: { id: questionId },
    data: { optionsViewed: true },
  });
  await prisma.quiz.update({
    where: { id: quizId },
    data: { phase: 'answering_with_options' },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function passQuestion(quizId: string, questionId: string, teamId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { teams: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] } } });
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question || !quiz || question.optionsViewed) return { success: false, error: 'Cannot pass' };

  const attemptedTeams = [...(question.attemptedBy || []), teamId];
  const teamCount = quiz.teams.length;
  let nextAnswerTurnIndex = quiz.answerTurnIndex;
  let nextTeamId = teamId;
  let foundNextTeam = false;
  
  for (let i = 0; i < teamCount; i++) {
    nextAnswerTurnIndex = (nextAnswerTurnIndex + 1) % teamCount;
    const candidateTeamId = quiz.teams[nextAnswerTurnIndex]?.id;
    if (!attemptedTeams.includes(candidateTeamId)) {
      nextTeamId = candidateTeamId;
      foundNextTeam = true;
      break;
    }
  }
  
  const answerResult = { teamId, answer: '', isCorrect: false, points: 0, withOptions: false, wasTabActive: true, questionText: question.text, correctAnswer: question.answer, questionCompleted: false };
  
  if (!foundNextTeam) {
    // Last team - dismiss question and move to next selector
    answerResult.questionCompleted = true;
    await prisma.question.update({ where: { id: questionId }, data: { isAnswered: true, correctAnswer: question.answer, attemptedBy: { push: teamId } } });
    await prisma.quiz.update({ where: { id: quizId }, data: { lastDomainAnswer: answerResult } });
    
    const newQuestionsInDomain = quiz.questionsInDomain + 1;
    const domain = await prisma.domain.findUnique({ where: { id: quiz.selectedDomainId! }, include: { questions: true } });
    const totalQuestionsForDomain = Math.floor((domain?.questions.length || 0) / teamCount) * teamCount;
    
    if (newQuestionsInDomain >= totalQuestionsForDomain) {
      // Domain complete - show result first
      await prisma.quiz.update({
        where: { id: quizId },
        data: { phase: 'showing_result', timerEndsAt: new Date(Date.now() + 15000), questionsInDomain: newQuestionsInDomain },
      });
    } else {
      const nextSelectorIndex = (quiz.questionSelectorIndex + 1) % teamCount;
      await prisma.quiz.update({ where: { id: quizId }, data: { phase: 'showing_result', timerEndsAt: new Date(Date.now() + 10000), questionsInDomain: newQuestionsInDomain, questionSelectorIndex: nextSelectorIndex, answerTurnIndex: nextSelectorIndex } });
    }
  } else {
    // Pass to next team
    await prisma.question.update({ where: { id: questionId }, data: { passedFrom: question.passedFrom || teamId, attemptedBy: { push: teamId } } });
    await prisma.quiz.update({ where: { id: quizId }, data: { currentTeamId: nextTeamId, phase: 'answering', timerEndsAt: new Date(Date.now() + 30000), answerTurnIndex: nextAnswerTurnIndex, lastDomainAnswer: answerResult } });
  }
  
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}

export async function handleTimerExpiry(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ 
    where: { id: quizId }, 
    include: { teams: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] } } 
  });
  if (!quiz || (quiz.phase !== 'answering' && quiz.phase !== 'answering_with_options')) return { success: false };
  
  const question = await prisma.question.findUnique({ 
    where: { id: quiz.currentQuestionId! } 
  });
  if (!question) return { success: false };
  
  const withOptions = quiz.phase === 'answering_with_options';
  return submitDomainAnswer(quizId, quiz.currentTeamId!, quiz.currentQuestionId!, '', withOptions, false);
}

export async function submitDomainAnswer(
  quizId: string,
  teamId: string,
  questionId: string,
  answer: string,
  withOptions: boolean,
  wasTabActive: boolean = true
) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { teams: { orderBy: [{ sequence: 'asc' }, { id: 'asc' }] } } });
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question || !quiz) return { success: false, error: 'Not found' };

  const actuallyCorrect = answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
  const isCorrect = wasTabActive && actuallyCorrect;
  const isPassed = question.passedFrom !== null;
  const teamCount = quiz.teams.length;
  
  let points = 0;
  
  // Store answer result
  const answerResult = { teamId, answer, isCorrect, points: 0, withOptions, wasTabActive, questionText: question.text, correctAnswer: question.answer, questionCompleted: false };
  
  if (isCorrect) {
    // Award points: +10 without options, +5 with options (same for all teams)
    points = withOptions ? 5 : 10;
    answerResult.points = points;
    answerResult.questionCompleted = true;
    await prisma.team.update({ where: { id: teamId }, data: { score: { increment: points } } });
    await prisma.question.update({ where: { id: questionId }, data: { isAnswered: true, correctAnswer: answer } });
    await prisma.quiz.update({ where: { id: quizId }, data: { lastDomainAnswer: answerResult } });
    
    const newQuestionsInDomain = quiz.questionsInDomain + 1;
    const domain = await prisma.domain.findUnique({ where: { id: quiz.selectedDomainId! }, include: { questions: true } });
    const totalQuestionsForDomain = Math.floor((domain?.questions.length || 0) / teamCount) * teamCount;
    
    if (newQuestionsInDomain >= totalQuestionsForDomain) {
      // Domain complete - show result first
      await prisma.quiz.update({
        where: { id: quizId },
        data: { phase: 'showing_result', timerEndsAt: new Date(Date.now() + 15000), questionsInDomain: newQuestionsInDomain },
      });
    } else {
      // Continue in same domain - show result first, update selector for next question
      const nextSelectorIndex = (quiz.questionSelectorIndex + 1) % teamCount;
      await prisma.quiz.update({
        where: { id: quizId },
        data: { phase: 'showing_result', timerEndsAt: new Date(Date.now() + 10000), questionsInDomain: newQuestionsInDomain, questionSelectorIndex: nextSelectorIndex, answerTurnIndex: nextSelectorIndex },
      });
    }
  } else if (!withOptions && actuallyCorrect && !wasTabActive) {
    // Tab was inactive - 0 points but don't pass, mark as answered and move to next selector
    await prisma.question.update({ where: { id: questionId }, data: { isAnswered: true, correctAnswer: question.answer } });
    const newQuestionsInDomain = quiz.questionsInDomain + 1;
    const domain = await prisma.domain.findUnique({ where: { id: quiz.selectedDomainId! }, include: { questions: true } });
    const totalQuestionsForDomain = Math.floor((domain?.questions.length || 0) / teamCount) * teamCount;
    
    if (newQuestionsInDomain >= totalQuestionsForDomain) {
      const completedSelections = (quiz.completedDomainRounds || 0) + 1;
      if (completedSelections >= (quiz.totalDomainRounds || 0)) {
        await prisma.quiz.update({ where: { id: quizId }, data: { phase: 'domain_round_ended', currentTeamId: null, currentQuestionId: null, selectedDomainId: null, timerEndsAt: null, completedDomainRounds: completedSelections } });
      } else {
        const nextDomainIndex = (quiz.domainIndex + 1) % teamCount;
        await prisma.quiz.update({ where: { id: quizId }, data: { currentTeamId: quiz.teams[nextDomainIndex]?.id, phase: 'selecting_domain', currentQuestionId: null, selectedDomainId: null, timerEndsAt: null, questionsInDomain: 0, domainSelectingTeam: nextDomainIndex, completedDomainRounds: completedSelections, domainIndex: nextDomainIndex, questionSelectorIndex: nextDomainIndex, answerTurnIndex: nextDomainIndex } });
      }
    } else {
      const nextSelectorIndex = (quiz.questionSelectorIndex + 1) % teamCount;
      await prisma.quiz.update({ where: { id: quizId }, data: { currentTeamId: quiz.teams[nextSelectorIndex]?.id, phase: 'selecting_question', currentQuestionId: null, timerEndsAt: null, questionsInDomain: newQuestionsInDomain, questionSelectorIndex: nextSelectorIndex, answerTurnIndex: nextSelectorIndex } });
    }
  } else if (withOptions) {
    // Wrong with options - penalty -5 points, dismiss question
    points = -5;
    answerResult.points = points;
    answerResult.questionCompleted = true;
    await prisma.team.update({ where: { id: teamId }, data: { score: { increment: points } } });
    await prisma.question.update({ where: { id: questionId }, data: { isAnswered: true, correctAnswer: question.answer } });
    await prisma.quiz.update({ where: { id: quizId }, data: { lastDomainAnswer: answerResult } });
    
    const newQuestionsInDomain = quiz.questionsInDomain + 1;
    const domain = await prisma.domain.findUnique({ where: { id: quiz.selectedDomainId! }, include: { questions: true } });
    const totalQuestionsForDomain = Math.floor((domain?.questions.length || 0) / teamCount) * teamCount;
    
    if (newQuestionsInDomain >= totalQuestionsForDomain) {
      await prisma.quiz.update({
        where: { id: quizId },
        data: { phase: 'showing_result', timerEndsAt: new Date(Date.now() + 15000), questionsInDomain: newQuestionsInDomain },
      });
    } else {
      const nextSelectorIndex = (quiz.questionSelectorIndex + 1) % teamCount;
      await prisma.quiz.update({
        where: { id: quizId },
        data: { phase: 'showing_result', timerEndsAt: new Date(Date.now() + 10000), questionsInDomain: newQuestionsInDomain, questionSelectorIndex: nextSelectorIndex, answerTurnIndex: nextSelectorIndex },
      });
    }
  } else {
    // Wrong without options - auto pass to next team
    const attemptedTeams = [...(question.attemptedBy || []), teamId];
    let foundNextTeam = false;
    let nextAnswerTurnIndex = quiz.answerTurnIndex;
    let nextTeamId = teamId;
    
    for (let i = 0; i < teamCount; i++) {
      nextAnswerTurnIndex = (nextAnswerTurnIndex + 1) % teamCount;
      const candidateTeamId = quiz.teams[nextAnswerTurnIndex]?.id;
      if (!attemptedTeams.includes(candidateTeamId)) {
        nextTeamId = candidateTeamId;
        foundNextTeam = true;
        break;
      }
    }
    
    if (foundNextTeam) {
      // Pass to next team
      await prisma.question.update({ where: { id: questionId }, data: { passedFrom: question.passedFrom || teamId, attemptedBy: { push: teamId } } });
      await prisma.quiz.update({ where: { id: quizId }, data: { currentTeamId: nextTeamId, phase: 'answering', timerEndsAt: new Date(Date.now() + 30000), answerTurnIndex: nextAnswerTurnIndex, lastDomainAnswer: answerResult } });
    } else {
      // No more teams - dismiss and move to next question selector
      answerResult.questionCompleted = true;
      await prisma.question.update({ where: { id: questionId }, data: { isAnswered: true, correctAnswer: question.answer, attemptedBy: { push: teamId } } });
      await prisma.quiz.update({ where: { id: quizId }, data: { lastDomainAnswer: answerResult } });
      
      const newQuestionsInDomain = quiz.questionsInDomain + 1;
      const domain = await prisma.domain.findUnique({ where: { id: quiz.selectedDomainId! }, include: { questions: true } });
      const totalQuestionsForDomain = Math.floor((domain?.questions.length || 0) / teamCount) * teamCount;
      
      if (newQuestionsInDomain >= totalQuestionsForDomain) {
        // Domain complete - show result first
        await prisma.quiz.update({
          where: { id: quizId },
          data: { phase: 'showing_result', timerEndsAt: new Date(Date.now() + 15000), questionsInDomain: newQuestionsInDomain },
        });
      } else {
        const nextSelectorIndex = (quiz.questionSelectorIndex + 1) % teamCount;
        await prisma.quiz.update({ where: { id: quizId }, data: { phase: 'showing_result', timerEndsAt: new Date(Date.now() + 10000), questionsInDomain: newQuestionsInDomain, questionSelectorIndex: nextSelectorIndex, answerTurnIndex: nextSelectorIndex } });
      }
    }
  }

  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true, isCorrect, points, correctAnswer: question.answer };
}

export async function resetQuiz(quizId: string) {
  await prisma.team.updateMany({ where: { quizId }, data: { score: 0 } });
  await prisma.question.updateMany({
    where: { domain: { quizId } },
    data: { isAnswered: false, passedFrom: null, attemptedBy: [], selectedBy: null, correctAnswer: null, optionsViewed: false },
  });
  await prisma.buzzerQuestion.updateMany({
    where: { quizId },
    data: { isAnswered: false, passedFrom: null },
  });
  await prisma.quiz.update({
    where: { id: quizId },
    data: { 
      status: 'setup', 
      round: 'not_started', 
      phase: 'waiting', 
      currentTeamId: null,
      currentQuestionId: null,
      selectedDomainId: null,
      timerEndsAt: null,
      buzzSequence: [],
      domainSelectingTeam: 0,
      questionsInDomain: 0,
      usedDomains: [],
      totalDomainRounds: 0,
      completedDomainRounds: 0,
      domainIndex: 0,
      questionSelectorIndex: 0,
      answerTurnIndex: 0,
      pendingBuzzerAnswers: {},
      buzzTimers: {},
      lastRoundResults: {},
      lastDomainAnswer: {}
    },
  });
  revalidatePath(`/quiz/${quizId}/host`);
  revalidatePath(`/quiz/${quizId}/team`);
  emitUpdate(quizId);
  return { success: true };
}
