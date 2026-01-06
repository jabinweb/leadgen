import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sequenceService } from '@/lib/crm/sequence-service';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sequences = await sequenceService.getUserSequences(session.user.id);
    return NextResponse.json(sequences);
  } catch (error: any) {
    console.error('Error fetching sequences:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, steps } = body;

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Name and steps are required' },
        { status: 400 }
      );
    }

    const sequence = await sequenceService.createSequence(session.user.id, {
      name,
      description,
      steps,
    });

    return NextResponse.json(sequence, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sequence:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
