import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ScrapingStatus } from '@prisma/client';
import { scrapingQueue } from '@/lib/scraping/queue';

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

    if (job.status === ScrapingStatus.RUNNING || job.status === ScrapingStatus.PENDING) {
      return NextResponse.json(
        { error: 'Job is already running or pending' },
        { status: 400 }
      );
    }

    // Delete leads from the previous run to start clean
    const deletedLeads = await prisma.lead.deleteMany({
      where: { scrapingJobId: id },
    });
    if (deletedLeads.count > 0) {
      console.log(`[Retry] Cleaned up ${deletedLeads.count} stale leads from job ${id}`);
    }

    // Reset job status and add back to queue
    const updatedJob = await prisma.scrapingJob.update({
      where: {
        id,
      },
      data: {
        status: ScrapingStatus.PENDING,
        progress: 0,
        totalFound: 0,
        successCount: 0,
        errorCount: 0,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      },
    });

    // Add to queue
    const config = updatedJob.configuration as any;
    await scrapingQueue.addJob(updatedJob.id, config, updatedJob.userId);

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error retrying job:', error);
    return NextResponse.json(
      { error: 'Failed to retry job' },
      { status: 500 }
    );
  }
}
