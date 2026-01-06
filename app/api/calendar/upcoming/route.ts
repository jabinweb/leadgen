import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { calendarService } from '@/lib/crm/calendar-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const events = await calendarService.getUpcomingEvents(
      session.user.id,
      days
    );

    return NextResponse.json(events);
  } catch (error) {
    console.error('Upcoming events fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming events' },
      { status: 500 }
    );
  }
}
