import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dealService } from '@/lib/crm/deal-service';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const body = await req.json();
    const { action, lostReason } = body;

    let deal;
    if (action === 'next') {
      deal = await dealService.moveToNextStage(params.id);
    } else if (action === 'won') {
      deal = await dealService.markAsWon(params.id);
    } else if (action === 'lost') {
      deal = await dealService.markAsLost(params.id, lostReason || 'No reason provided');
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(deal);
  } catch (error: any) {
    console.error('Error moving deal stage:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
