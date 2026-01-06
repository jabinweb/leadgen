import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { unsubscribeService } from '@/lib/crm/unsubscribe-service';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await unsubscribeService.getUnsubscribeStats(session.user.id);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching unsubscribe stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
