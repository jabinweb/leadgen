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
    const sequence = await sequenceService.getSequenceWithStats(params.id);

    if (!sequence || sequence.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    return NextResponse.json(sequence);
  } catch (error: any) {
    console.error('Error fetching sequence:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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
    const { name, description, steps } = body;

    const sequence = await sequenceService.updateSequence(params.id, {
      name,
      description,
      steps,
    });

    return NextResponse.json(sequence);
  } catch (error: any) {
    console.error('Error updating sequence:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    await sequenceService.deleteSequence(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sequence:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
