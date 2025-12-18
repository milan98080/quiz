import { NextRequest, NextResponse } from 'next/server';
import { handleShowingResultExpiry } from '@/lib/handleShowingResult';

export async function POST(request: NextRequest) {
  const { quizId } = await request.json();
  await handleShowingResultExpiry(quizId);
  return NextResponse.json({ success: true });
}
