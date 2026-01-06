import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { calendarService } from '@/lib/crm/calendar-service';
import { CalendarEventType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const leadId = searchParams.get('leadId');
    const dealId = searchParams.get('dealId');
    const eventType = searchParams.get('eventType') as CalendarEventType | null;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (leadId) filters.leadId = leadId;
    if (dealId) filters.dealId = dealId;
    if (eventType) filters.eventType = eventType;

    const events = await calendarService.getUserEvents(
      session.user.id,
      filters
    );

    return NextResponse.json(events);
  } catch (error) {
    console.error('Calendar events fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      leadId,
      dealId,
      title,
      description,
      location,
      eventType,
      startTime,
      endTime,
      allDay,
      attendees,
      meetingLink,
      reminderMinutes,
    } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      );
    }

    const event = await calendarService.createEvent({
      userId: session.user.id,
      leadId,
      dealId,
      title,
      description,
      location,
      eventType,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      allDay,
      attendees,
      meetingLink,
      reminderMinutes,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Calendar event creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
