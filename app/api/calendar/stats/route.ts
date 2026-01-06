import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { calendarService } from '@/lib/crm/calendar-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await calendarService.getEventStats(session.user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Calendar stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar stats' },
      { status: 500 }
    );
  }
}
