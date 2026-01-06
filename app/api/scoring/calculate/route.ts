import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { leadScoringService } from '@/lib/crm/lead-scoring-service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    const score = await leadScoringService.calculateLeadScore(leadId);
    return NextResponse.json(score);
  } catch (error: any) {
    console.error('Error calculating lead score:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
