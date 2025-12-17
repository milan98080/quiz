import { getQuizData } from '@/lib/actions';
import { redirect } from 'next/navigation';
import TeamInterface from '@/components/TeamInterface';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const quiz = await getQuizData(quizId);
  if (!quiz) redirect('/team');

  return <TeamInterface quiz={quiz} />;
}
