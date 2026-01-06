import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleCalendarSync } from '@/lib/crm/google-calendar-sync';

// Check Google Calendar connection status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await GoogleCalendarSync.hasCalendarAccess(
      session.user.id
    );
    const tokens = await GoogleCalendarSync.getAccessToken(session.user.id);

    return NextResponse.json({
      connected: hasAccess,
      hasTokens: !!tokens,
    });
  } catch (error) {
    console.error('Calendar status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check calendar status' },
      { status: 500 }
    );
  }
}
