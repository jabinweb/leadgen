import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { scrapingQueue } from '@/lib/scraping/queue';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queueStatus = scrapingQueue.getQueueStatus();

    return NextResponse.json(queueStatus);
  } catch (error) {
    console.error('Error fetching scraping status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}