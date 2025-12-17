import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const session = await getSession();
  
  if (!session.isHost) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.quiz.delete({
      where: { id: params.quizId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}
