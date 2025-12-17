import { getQuizData } from '@/lib/actions';
import { notFound } from 'next/navigation';
import SpectatorView from '@/components/SpectatorView';

export default async function SpectatorPage({ params }: { params: { quizId: string } }) {
  const quiz = await getQuizData(params.quizId);
  if (!quiz) return notFound();

  return <SpectatorView quiz={quiz} />;
}
