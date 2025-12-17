import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import HostSessionManager from '@/components/HostSessionManager';
import HostLogin from '@/components/HostLogin';

export default async function HostPage() {
  const session = await getSession();
  
  if (!session.isHost) {
    return <HostLogin />;
  }

  const quizzes = await prisma.quiz.findMany({
    include: {
      teams: true,
      domains: { include: { questions: true } },
      buzzerQuestions: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return <HostSessionManager quizzes={JSON.parse(JSON.stringify(quizzes))} />;
}
