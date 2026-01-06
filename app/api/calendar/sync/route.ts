import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGoogleCalendarSync } from '@/lib/crm/google-calendar-sync';

// Sync a specific event to Google Calendar
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const syncClient = await getGoogleCalendarSync(session.user.id);
    const googleEvent = await syncClient.syncEventToGoogle(
      eventId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      googleEventId: googleEvent.id,
    });
  } catch (error: any) {
    console.error('Google Calendar sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync with Google Calendar' },
      { status: 500 }
    );
  }
}
