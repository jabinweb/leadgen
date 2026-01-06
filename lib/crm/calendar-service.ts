import { prisma } from '@/lib/prisma';
import { CalendarEventType, CalendarStatus } from '@prisma/client';

export interface CreateCalendarEventInput {
  userId: string;
  leadId?: string;
  dealId?: string;
  title: string;
  description?: string;
  location?: string;
  eventType?: CalendarEventType;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  attendees?: string[];
  meetingLink?: string;
  reminderMinutes?: number;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string;
  location?: string;
  eventType?: CalendarEventType;
  startTime?: Date;
  endTime?: Date;
  allDay?: boolean;
  attendees?: string[];
  meetingLink?: string;
  reminderMinutes?: number;
  status?: CalendarStatus;
}

export const calendarService = {
  // Create a calendar event
  async createEvent(data: CreateCalendarEventInput) {
    return await prisma.calendarEvent.create({
      data: {
        userId: data.userId,
        leadId: data.leadId,
        dealId: data.dealId,
        title: data.title,
        description: data.description,
        location: data.location,
        eventType: data.eventType || CalendarEventType.MEETING,
        startTime: data.startTime,
        endTime: data.endTime,
        allDay: data.allDay || false,
        attendees: data.attendees || [],
        meetingLink: data.meetingLink,
        reminderMinutes: data.reminderMinutes,
      },
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    });
  },

  // Get all events for a user with optional filters
  async getUserEvents(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      leadId?: string;
      dealId?: string;
      status?: CalendarStatus;
      eventType?: CalendarEventType;
    }
  ) {
    const where: any = { userId };

    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters.startDate) where.startTime.gte = filters.startDate;
      if (filters.endDate) where.startTime.lte = filters.endDate;
    }

    if (filters?.leadId) where.leadId = filters.leadId;
    if (filters?.dealId) where.dealId = filters.dealId;
    if (filters?.status) where.status = filters.status;
    if (filters?.eventType) where.eventType = filters.eventType;

    return await prisma.calendarEvent.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  },

  // Get events for a specific date range (for calendar views)
  async getEventsInRange(userId: string, startDate: Date, endDate: Date) {
    return await prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  },

  // Get a single event by ID
  async getEventById(eventId: string, userId: string) {
    return await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            probability: true,
          },
        },
      },
    });
  },

  // Update a calendar event
  async updateEvent(
    eventId: string,
    userId: string,
    data: UpdateCalendarEventInput
  ) {
    return await prisma.calendarEvent.update({
      where: {
        id: eventId,
        userId,
      },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.eventType && { eventType: data.eventType }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.allDay !== undefined && { allDay: data.allDay }),
        ...(data.attendees && { attendees: data.attendees }),
        ...(data.meetingLink !== undefined && { meetingLink: data.meetingLink }),
        ...(data.reminderMinutes !== undefined && {
          reminderMinutes: data.reminderMinutes,
        }),
        ...(data.status && { status: data.status }),
      },
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    });
  },

  // Delete a calendar event
  async deleteEvent(eventId: string, userId: string) {
    return await prisma.calendarEvent.delete({
      where: {
        id: eventId,
        userId,
      },
    });
  },

  // Get upcoming events (next 7 days)
  async getUpcomingEvents(userId: string, days: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: {
          gte: now,
          lte: futureDate,
        },
        status: CalendarStatus.SCHEDULED,
      },
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 20,
    });
  },

  // Mark event as completed
  async completeEvent(eventId: string, userId: string) {
    return await prisma.calendarEvent.update({
      where: {
        id: eventId,
        userId,
      },
      data: {
        status: CalendarStatus.COMPLETED,
      },
    });
  },

  // Mark event as cancelled
  async cancelEvent(eventId: string, userId: string) {
    return await prisma.calendarEvent.update({
      where: {
        id: eventId,
        userId,
      },
      data: {
        status: CalendarStatus.CANCELLED,
      },
    });
  },

  // Get event statistics
  async getEventStats(userId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalEvents, scheduledEvents, completedEvents, thisMonthEvents] =
      await Promise.all([
        prisma.calendarEvent.count({ where: { userId } }),
        prisma.calendarEvent.count({
          where: { userId, status: CalendarStatus.SCHEDULED },
        }),
        prisma.calendarEvent.count({
          where: { userId, status: CalendarStatus.COMPLETED },
        }),
        prisma.calendarEvent.count({
          where: {
            userId,
            startTime: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth,
            },
          },
        }),
      ]);

    return {
      total: totalEvents,
      scheduled: scheduledEvents,
      completed: completedEvents,
      thisMonth: thisMonthEvents,
    };
  },
};
