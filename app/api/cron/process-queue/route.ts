import { NextRequest, NextResponse } from 'next/server';
import { emailQueueService } from '@/lib/crm/email-queue-service';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        emailVerified: { not: null },
      },
      select: { id: true },
    });

    const results = await Promise.allSettled(
      users.map((user) => emailQueueService.processQueue())
    );

    const totalSent = results
      .filter((r) => r.status === 'fulfilled')
      .reduce((sum, r: any) => sum + (r.value?.sent || 0), 0);

    return NextResponse.json({
      users: users.length,
      totalSent,
      processed: results.length,
    });
  } catch (error: any) {
    console.error('Error processing email queue:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
