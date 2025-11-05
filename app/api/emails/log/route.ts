import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
      ...(search && {
        OR: [
          { to: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && status !== 'all' && { status }),
    };

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
        include: {
          lead: {
            select: {
              companyName: true,
              contactName: true,
            },
          },
          campaign: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.emailLog.count({ where }),
    ]);

    // Calculate stats
    const allLogs = await prisma.emailLog.findMany({
      where: { userId: session.user.id },
      select: {
        status: true,
        sentAt: true,
        openedAt: true,
        clickedAt: true,
        repliedAt: true,
      },
    });

    const stats = {
      total: allLogs.length,
      sent: allLogs.filter((l: any) => l.status === 'SENT' || l.status === 'DELIVERED' || l.status === 'OPENED' || l.status === 'CLICKED' || l.status === 'REPLIED').length,
      delivered: allLogs.filter((l: any) => l.status === 'DELIVERED' || l.status === 'OPENED' || l.status === 'CLICKED' || l.status === 'REPLIED').length,
      opened: allLogs.filter((l: any) => l.openedAt).length,
      clicked: allLogs.filter((l: any) => l.clickedAt).length,
      replied: allLogs.filter((l: any) => l.repliedAt).length,
      failed: allLogs.filter((l: any) => l.status === 'FAILED').length,
      bounced: allLogs.filter((l: any) => l.status === 'BOUNCED').length,
      openRate: 0,
      clickRate: 0,
      replyRate: 0,
    };

    const delivered = stats.delivered;
    if (delivered > 0) {
      stats.openRate = Math.round((stats.opened / delivered) * 100);
      stats.clickRate = Math.round((stats.clicked / delivered) * 100);
      stats.replyRate = Math.round((stats.replied / delivered) * 100);
    }

    return NextResponse.json({
      logs,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
