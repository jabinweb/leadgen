import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sequenceService } from '@/lib/crm/sequence-service';

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
    const { leadIds } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'leadIds array is required' },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      leadIds.map((leadId: string) =>
        sequenceService.enrollLead(params.id, leadId)
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      total: leadIds.length,
      succeeded,
      failed,
    });
  } catch (error: any) {
    console.error('Error enrolling leads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
