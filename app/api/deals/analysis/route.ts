import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dealService } from '@/lib/crm/deal-service';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysis = await dealService.getWinLossAnalysis(session.user.id);
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error fetching win/loss analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
