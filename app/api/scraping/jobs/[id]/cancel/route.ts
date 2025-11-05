import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ScrapingStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.scrapingJob.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== ScrapingStatus.RUNNING && job.status !== ScrapingStatus.PENDING) {
      return NextResponse.json(
        { error: 'Only running or pending jobs can be cancelled' },
        { status: 400 }
      );
    }

    const updatedJob = await prisma.scrapingJob.update({
      where: {
        id,
      },
      data: {
        status: ScrapingStatus.CANCELLED,
        errorMessage: 'Job cancelled by user',
        completedAt: new Date(),
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error cancelling job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}
