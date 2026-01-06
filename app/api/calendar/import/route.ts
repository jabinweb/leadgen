import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGoogleCalendarSync } from '@/lib/crm/google-calendar-sync';

// Import events from Google Calendar
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate } = body;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const syncClient = await getGoogleCalendarSync(session.user.id);
    const imported = await syncClient.importFromGoogle(
      session.user.id,
      start,
      end
    );

    return NextResponse.json({
      success: true,
      imported: imported.length,
      events: imported,
    });
  } catch (error: any) {
    console.error('Google Calendar import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import from Google Calendar' },
      { status: 500 }
    );
  }
}
