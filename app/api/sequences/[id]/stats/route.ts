import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sequenceService } from '@/lib/crm/sequence-service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const stats = await sequenceService.getSequenceWithStats(params.id);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching sequence stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
