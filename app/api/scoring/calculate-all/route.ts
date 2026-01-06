import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { leadScoringService } from '@/lib/crm/lead-scoring-service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await leadScoringService.calculateAllScores(session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error calculating all scores:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
