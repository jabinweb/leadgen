import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { unsubscribeService } from '@/lib/crm/unsubscribe-service';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const list = await unsubscribeService.getUnsubscribeList(session.user.id);
    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error fetching unsubscribe list:', error);
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
    const { emails } = body;

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'emails array is required' },
        { status: 400 }
      );
    }

    const result = await unsubscribeService.bulkImport(emails, session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error bulk importing unsubscribes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
