'use client';

import { Clock, CheckCircle, XCircle, Award, Pause, Zap, Trophy, Timer, AlertCircle, Info, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as React from 'react';
import { createTeam, joinTeam, selectDomain, selectQuestion, submitDomainAnswer, showOptions, passQuestion, buzz, submitBuzzerAnswer } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

export default function TeamInterface({ quiz }: { quiz: any }) {
  useSocket(quiz.id);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [answer, setAnswer] = useState('');

  const [timeLeft, setTimeLeft] = useState(0);
  const [buzzTimeLeft, setBuzzTimeLeft] = useState(0);
  const [buzzTimerStart, setBuzzTimerStart] = useState<number | null>(null);
  const [myAnswerTimeLeft, setMyAnswerTimeLeft] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const router = useRouter();

  const isMyTurn = quiz.currentTeamId === selectedTeam;
  const hasBuzzed = quiz.buzzSequence?.includes(selectedTeam);

  useEffect(() => {
    const teamId = localStorage.getItem('teamId');
    if (teamId && quiz.teams.some((t: any) => t.id === teamId)) {
      setSelectedTeam(teamId);
      setJoined(true);
    } else {
      localStorage.removeItem('teamId');
    }
  }, [quiz.teams]);

  // Track when buzzing phase starts for 10-second buzz timer
  useEffect(() => {
    if (quiz.round === 'buzzer' && quiz.phase === 'buzzing' && quiz.currentQuestionId) {
      setBuzzTimerStart(Date.now());
      setBuzzTimeLeft(10);
      setHasSubmitted(false);
      setAnswer('');
    } else if (quiz.phase === 'answering' && buzzTimerStart) {
      // Keep buzz timer running during answering phase
      const elapsed = Math.floor((Date.now() - buzzTimerStart) / 1000);
      setBuzzTimeLeft(Math.max(0, 10 - elapsed));
    } else {
      setBuzzTimerStart(null);
      setBuzzTimeLeft(0);
    }
  }, [quiz.phase, quiz.currentQuestionId, quiz.round]);

  // Track individual team's 20-second answer timer
  useEffect(() => {
    if (hasBuzzed && quiz.buzzTimers && quiz.buzzTimers[selectedTeam]) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((quiz.buzzTimers[selectedTeam] - Date.now()) / 1000));
        setMyAnswerTimeLeft(remaining);
        
        // Show timeout toast and disable submit when timer expires
        if (remaining === 0 && !hasSubmitted) {
          setHasSubmitted(true);
          if (quiz.phase === 'answering') {
            setToast({
              message: ' Timeout! You did not submit an answer.',
              type: 'error'
            });
          }
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      setMyAnswerTimeLeft(0);
    }
  }, [hasBuzzed, quiz.buzzTimers, selectedTeam, hasSubmitted, quiz.phase]);

  // Buzz timer countdown
  useEffect(() => {
    if (buzzTimerStart && buzzTimeLeft > 0) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - buzzTimerStart) / 1000);
        const remaining = Math.max(0, 10 - elapsed);
        setBuzzTimeLeft(remaining);
        
        // Only trigger expiry if still in buzzing phase and no one has buzzed
        if (remaining === 0 && quiz.phase === 'buzzing' && quiz.buzzSequence.length === 0) {
          import('@/lib/actions').then(({ handleBuzzTimerExpiry }) => {
            handleBuzzTimerExpiry(quiz.id);
          });
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [buzzTimerStart, buzzTimeLeft, quiz.phase, quiz.id, quiz.buzzSequence]);

  // Check buzzer timers periodically
  useEffect(() => {
    if (quiz.round === 'buzzer' && quiz.phase === 'answering') {
      const interval = setInterval(() => {
        import('@/lib/checkBuzzerTimers').then(({ checkBuzzerTimers }) => {
          checkBuzzerTimers(quiz.id);
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quiz.round, quiz.phase, quiz.id]);

  // Show results when moving to showing_answer phase
  useEffect(() => {
    if (quiz.round === 'buzzer' && quiz.phase === 'showing_answer' && quiz.lastRoundResults) {
      const myResult = quiz.lastRoundResults[selectedTeam];
      if (myResult && hasBuzzed) {
        if (myResult.timeout) {
          setToast({
            message: ` Timeout! ${myResult.points} points`,
            type: 'error'
          });
        } else if (myResult.isCorrect) {
          setToast({
            message: ` Correct! +${myResult.points} points`,
            type: 'success'
          });
        } else {
          setToast({
            message: ` Wrong! ${myResult.points} points`,
            type: 'error'
          });
        }
      }
    }
  }, [quiz.phase, quiz.lastRoundResults, selectedTeam, hasBuzzed, quiz.round]);

  useEffect(() => {
    if (quiz.timerEndsAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(quiz.timerEndsAt).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);
        
        // Auto-pass when timer expires (domain round)
        if (remaining === 0 && isMyTurn && (quiz.phase === 'answering' || quiz.phase === 'answering_with_options') && quiz.round === 'domain') {
          setToast({
            message: ' Timeout! Question passed.',
            type: 'error'
          });
          import('@/lib/actions').then(({ handleTimerExpiry }) => {
            handleTimerExpiry(quiz.id);
          });
        }
        
        
        // Handle buzzer showing answer timer
        if (remaining === 0 && quiz.phase === 'showing_answer' && quiz.round === 'buzzer') {
          import('@/lib/buzzerTimer').then(({ handleBuzzerTimerExpiry }) => {
            handleBuzzerTimerExpiry(quiz.id);
          });
        }
        
        // Handle showing_result timer
        if (remaining === 0 && quiz.phase === 'showing_result' && quiz.round === 'domain') {
          import('@/lib/handleShowingResult').then(({ handleShowingResultExpiry }) => {
            handleShowingResultExpiry(quiz.id);
          });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quiz.timerEndsAt, isMyTurn, quiz.phase, quiz.round, quiz.id]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await joinTeam(quiz.id, selectedTeam, playerName);
    if (result.success) {
      localStorage.setItem('teamId', selectedTeam);
      setJoined(true);
    }
  };

  const handleCreateAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const teamResult = await createTeam(quiz.id, newTeamName);
    if (teamResult.success) {
      const joinResult = await joinTeam(quiz.id, teamResult.teamId, playerName);
      if (joinResult.success) {
        localStorage.setItem('teamId', teamResult.teamId);
        setSelectedTeam(teamResult.teamId);
        setJoined(true);
      }
    }
  };

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-center"> Join Team</h1>
          <form onSubmit={handleJoinTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:outline-none focus:border-emerald-500 transition-colors text-white"
                  required
                >
                  <option value="" className="bg-gray-800">Choose a team</option>
                  {quiz.teams.map((team: any) => (
                    <option key={team.id} value={team.id} className="bg-gray-800">
                      {team.name} {team.captainName ? '(Joined)' : '(Available)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg font-semibold">
                Join Team
              </button>
            </form>
        </div>
      </div>
    );
  }

  const team = quiz.teams.find((t: any) => t.id === selectedTeam);
  const currentQuestion = quiz.round === 'domain' 
    ? quiz.domains?.flatMap((d: any) => d.questions).find((q: any) => q.id === quiz.currentQuestionId)
    : quiz.buzzerQuestions?.find((q: any) => q.id === quiz.currentQuestionId);
  const availableDomains = quiz.domains?.filter((d: any) => !quiz.usedDomains?.includes(d.id));

  return (
    <div className="min-h-screen p-4">
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg font-semibold ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} z-50`}>
          {toast.message}
        </div>
      )}
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <div className="mb-2">
            <h1 className="text-3xl font-bold">{team?.name}</h1>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xl">Score: {team?.score}</div>
            <div className="text-sm text-slate-400">Captain: {team?.captainName || 'Not joined'}</div>
          </div>
        </div>

        {/* QUIZ COMPLETED */}
        {quiz.status === 'active' && quiz.phase === 'completed' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="text-center py-8 mb-6">
              <h2 className="text-4xl font-bold mb-4"> Quiz Completed!</h2>
              <p className="text-slate-400 text-lg">Thank you for participating!</p>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-center">Final Standings</h2>
            <div className="space-y-3">
              {quiz.teams.sort((a: any, b: any) => b.score - a.score).map((t: any, i: number) => (
                <div key={t.id} className={`flex justify-between items-center rounded-lg p-4 ${
                  i === 0 ? 'bg-yellow-500/20 border-2 border-yellow-500' :
                  i === 1 ? 'bg-gray-400/20 border-2 border-gray-400' :
                  i === 2 ? 'bg-orange-500/20 border-2 border-orange-500' :
                  'bg-slate-800/50'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}.`}</div>
                    <div className="font-bold text-xl">{t.name}</div>
                  </div>
                  <div className="text-2xl font-bold">{t.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHOWING RESULT */}
        {quiz.round === 'domain' && quiz.status === 'active' && quiz.phase === 'showing_result' && quiz.lastDomainAnswer && quiz.lastDomainAnswer.questionCompleted && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className={`p-6 rounded-xl border-2 text-center ${
              quiz.lastDomainAnswer.isCorrect 
                ? 'bg-green-500/20 border-green-400' 
                : 'bg-red-500/20 border-red-400'
            }`}>
              <div className="flex items-center justify-center gap-3 mb-4">
                {quiz.lastDomainAnswer.isCorrect ? <CheckCircle className="w-10 h-10 text-emerald-400" /> : <XCircle className="w-10 h-10 text-red-400" />}
              </div>
              <h2 className="text-2xl font-bold mb-4 text-center">
                {quiz.lastDomainAnswer.isCorrect ? 'Correct Answer!' : 'No one could answer'}
              </h2>
              {quiz.lastDomainAnswer.questionText && (
                <div className="text-white/80 mb-4 italic">"{quiz.lastDomainAnswer.questionText}"</div>
              )}
              <div className="text-xl mb-2">
                <span className="font-bold">
                  {quiz.teams.find((t: any) => t.id === quiz.lastDomainAnswer.teamId)?.name}
                </span>
                {quiz.lastDomainAnswer.answer && (
                  <span className="text-white/60 ml-2">({quiz.lastDomainAnswer.answer})</span>
                )}
              </div>
              {!quiz.lastDomainAnswer.isCorrect && quiz.lastDomainAnswer.correctAnswer && (
                <div className="text-green-300 text-lg mb-2">
                  Correct Answer: {quiz.lastDomainAnswer.correctAnswer}
                </div>
              )}
              <div className={`text-3xl font-bold ${
                quiz.lastDomainAnswer.isCorrect ? 'text-green-300' : 'text-red-300'
              }`}>
                {quiz.lastDomainAnswer.points > 0 ? '+' : ''}{quiz.lastDomainAnswer.points} pts
              </div>
              {timeLeft > 0 && (
                <div className="text-white/70 text-sm mt-4">Next in {timeLeft}s...</div>
              )}
            </div>
          </div>
        )}

        {/* DOMAIN ROUND ENDED */}
        {quiz.round === 'domain' && quiz.status === 'active' && quiz.phase === 'domain_round_ended' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold mb-4"> Domain Round Ended!</h2>
              <p className="text-slate-400 text-lg">Waiting for host to start Buzzer Round...</p>
            </div>
          </div>
        )}

        {/* DOMAIN ROUND - DOMAIN SELECTION */}
        {quiz.round === 'domain' && quiz.status === 'active' && quiz.phase === 'selecting_domain' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            {!isMyTurn ? (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4"> Waiting...</h2>
                <p className="text-slate-400">
                  {quiz.teams.find((t: any) => t.id === quiz.currentTeamId)?.name} is selecting domain
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Select Domain</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableDomains?.map((domain: any) => (
                    <button
                      key={domain.id}
                      onClick={() => selectDomain(quiz.id, domain.id)}
                      className="p-6 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-lg"
                    >
                      {domain.name}
                      <div className="text-sm text-slate-300 mt-2">{domain.questions.filter((q: any) => !q.isAnswered).length} questions</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* DOMAIN ROUND - QUESTION SELECTION */}
        {quiz.round === 'domain' && quiz.status === 'active' && quiz.phase === 'selecting_question' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            {!isMyTurn ? (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4"> Waiting...</h2>
                <p className="text-slate-400">
                  {quiz.teams.find((t: any) => t.id === quiz.currentTeamId)?.name} is selecting question
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Select Question</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quiz.domains.find((d: any) => d.id === quiz.selectedDomainId)?.questions.map((q: any) => (
                    <button
                      key={q.id}
                      onClick={() => selectQuestion(quiz.id, q.id, selectedTeam)}
                      disabled={q.isAnswered}
                      className={`p-6 rounded-lg font-bold text-2xl ${
                        q.isAnswered ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {q.number}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* DOMAIN ROUND - ANSWERING */}
        {quiz.round === 'domain' && quiz.status === 'active' && (quiz.phase === 'answering' || quiz.phase === 'answering_with_options') && currentQuestion && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Question #{currentQuestion.number}</h2>
              {isMyTurn && timeLeft > 0 && (
                <div className={`text-3xl font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-green-500'}`}>
                  {timeLeft}s
                </div>
              )}
            </div>
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-4">
              <p className="text-lg">{currentQuestion.text}</p>
              {currentQuestion.passedFrom && (
                <p className="text-sm text-yellow-400 mt-2"> Passed question</p>
              )}
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!isMyTurn) return;
              const result = await submitDomainAnswer(quiz.id, selectedTeam, currentQuestion.id, answer, quiz.phase === 'answering_with_options');
              if (result.success) {
                if (result.isCorrect) {
                  setToast({
                    message: ` Correct! +${result.points} points`,
                    type: 'success'
                  });
                } else {
                  setToast({
                    message: ` Wrong!`,
                    type: 'error'
                  });
                }
              }
              setAnswer('');
            }} className="space-y-4">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder={isMyTurn ? "Type your answer..." : "Type your answer (wait for your turn to submit)..."}
                rows={4}
              />
              {!isMyTurn && (
                <div className="text-center text-sm text-yellow-400">
                  Waiting for {quiz.teams.find((t: any) => t.id === quiz.currentTeamId)?.name} to answer...
                </div>
              )}
              {quiz.phase === 'answering_with_options' && currentQuestion.options.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Options (click to submit):</p>
                  {currentQuestion.options.map((opt: string, i: number) => (
                    <button
                      key={i}
                      type="button"
                      disabled={!isMyTurn}
                      onClick={async () => {
                        const result = await submitDomainAnswer(quiz.id, selectedTeam, currentQuestion.id, opt, true);
                        if (result.success) {
                          if (result.isCorrect) {
                            setToast({
                              message: ` Correct! +${result.points} points`,
                              type: 'success'
                            });
                          } else {
                            setToast({
                              message: ` Wrong! -5 points`,
                              type: 'error'
                            });
                          }
                        }
                        setAnswer('');
                      }}
                      className="w-full p-3 bg-slate-800/50 hover:bg-green-600 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-4">
                {quiz.phase === 'answering' && !currentQuestion.optionsViewed && (
                  <button
                    type="button"
                    disabled={!isMyTurn}
                    onClick={async () => {
                      const result = await passQuestion(quiz.id, currentQuestion.id, selectedTeam);
                      if (result.success) {
                        setToast({ message: ' Question passed', type: 'success' });
                      }
                    }}
                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pass
                  </button>
                )}
                {quiz.phase === 'answering' && currentQuestion.options.length > 0 && !currentQuestion.optionsViewed && (
                  <button
                    type="button"
                    disabled={!isMyTurn}
                    onClick={() => showOptions(quiz.id, currentQuestion.id)}
                    className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Options (5/-5)
                  </button>
                )}
                <button type="submit" disabled={!isMyTurn} className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  Submit ({currentQuestion.optionsViewed ? '5/-5' : '10'})
                </button>
              </div>
            </form>
          </div>
        )}

        {/* QUIZ PAUSED */}
        {quiz.status === 'paused' && (quiz.round === 'domain' || quiz.round === 'buzzer') && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold mb-4">Paused Quiz Paused</h2>
              <p className="text-slate-400 text-lg">Waiting for host to resume...</p>
            </div>
          </div>
        )}

        {/* BUZZER ROUND */}
        {quiz.round === 'buzzer' && quiz.status === 'active' && quiz.phase !== 'completed' && currentQuestion && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Question #{currentQuestion.number}</h2>
            </div>
            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4 mb-4">
              <p className="text-lg">{currentQuestion.text}</p>
            </div>

            {hasBuzzed && quiz.buzzSequence && quiz.buzzSequence.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium mb-2">Buzz Sequence:</p>
                <div className="flex gap-2 flex-wrap">
                  {quiz.buzzSequence.map((teamId: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                      {i + 1}. {quiz.teams.find((t: any) => t.id === teamId)?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(quiz.phase === 'buzzing' || quiz.phase === 'answering') && !hasBuzzed && buzzTimeLeft > 0 && (
              <>
                <div className="text-center mb-2 text-yellow-400 font-semibold">
                  Buzz Time: {buzzTimeLeft}s
                </div>
                <button
                  onClick={() => buzz(quiz.id, selectedTeam)}
                  className="w-full py-6 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-2xl"
                >
                  BUZZ BUZZ!
                </button>
              </>
            )}
            
            {(quiz.phase === 'buzzing' || quiz.phase === 'answering') && !hasBuzzed && buzzTimeLeft === 0 && (
              <div className="text-center py-4 text-slate-500">
                Buzz time expired
              </div>
            )}

            {quiz.phase === 'showing_answer' && (
              <>
                <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-6 text-center mb-4">
                  <h3 className="text-xl font-bold mb-2">Correct Answer:</h3>
                  <p className="text-2xl font-bold text-green-400">{currentQuestion.answer}</p>
                  <p className="text-sm text-slate-400 mt-4">Next question in {timeLeft}s...</p>
                </div>
                
                
                {/* Round Results */}
                {quiz.lastRoundResults && Object.keys(quiz.lastRoundResults).length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-bold mb-3 text-center">Round Results</h3>
                    <div className="space-y-2">
                      {Object.entries(quiz.lastRoundResults).map(([teamId, result]: [string, any], i: number) => {
                        const team = quiz.teams.find((t: any) => t.id === teamId);
                        
                        let points = result.points || 0;
                        let status = 'No Answer';
                        let statusColor = 'text-slate-500';
                        
                        if (result.timeout) {
                          status = ' Timeout';
                          statusColor = 'text-yellow-400';
                        } else if (result.isCorrect) {
                          status = ' Correct';
                          statusColor = 'text-green-400';
                        } else if (result.answer) {
                          status = ' Wrong';
                          statusColor = 'text-red-400';
                        }
                        
                        return (
                          <div key={teamId} className="flex justify-between items-center bg-slate-900/30 rounded p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500">#{i + 1}</span>
                              <span className="font-semibold">{team?.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm ${statusColor}`}>{status}</span>
                              <span className={`font-bold ${points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {points > 0 ? '+' : ''}{points}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {hasBuzzed && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (hasSubmitted) return;
                const result = await submitBuzzerAnswer(quiz.id, selectedTeam, currentQuestion.id, answer);
                if (result.success && result.queued) {
                  setHasSubmitted(true);
                  setToast({
                    message: ' Answer queued! Results will be shown after all answers are processed.',
                    type: 'success'
                  });
                  setAnswer('');
                } else if (result.error) {
                  setToast({
                    message: ' ' + result.error,
                    type: 'error'
                  });
                }
              }} className="space-y-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 focus:outline-none focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder={hasSubmitted ? (myAnswerTimeLeft === 0 && !answer ? "Timeout!" : "Answer submitted!") : "Type your answer..."}
                  rows={4}
                  disabled={hasSubmitted}
                />
                {hasSubmitted ? (
                  <div className="text-center text-sm text-blue-400">
                    {myAnswerTimeLeft === 0 && !answer ? ' Timeout! Waiting for results...' : '✓ Answer submitted! Waiting for results...'}
                  </div>
                ) : (
                  <div className="text-center text-sm text-green-400">
                    ✓ You buzzed! Submit your answer ({myAnswerTimeLeft}s left)
                  </div>
                )}
                <button 
                  type="submit"
                  disabled={hasSubmitted || myAnswerTimeLeft === 0}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {myAnswerTimeLeft === 0 ? 'Timeout' : (hasSubmitted ? 'Submitted' : 'Submit Answer')}
                </button>
              </form>
            )}
          </div>
        )}

        {/* LEADERBOARD - Only show when quiz is not completed */}
        {quiz.phase !== 'completed' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4"><div className="flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-400" /><span>Leaderboard</span></div></h2>
            <div className="space-y-2">
              {quiz.teams.sort((a: any, b: any) => b.score - a.score).map((t: any, i: number) => (
                <div key={t.id} className="flex justify-between items-center bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}.`}</div>
                    <div className="font-semibold">{t.name}</div>
                  </div>
                  <div className="text-xl font-bold">{t.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
