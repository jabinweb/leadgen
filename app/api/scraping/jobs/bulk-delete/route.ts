import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobIds = searchParams.get('ids')?.split(',') || [];

    if (jobIds.length === 0) {
      return NextResponse.json({ error: 'No job IDs provided' }, { status: 400 });
    }

    // Delete all leads associated with these jobs first
    await prisma.lead.deleteMany({
      where: {
        scrapingJobId: {
          in: jobIds,
        },
        userId: session.user.id,
      },
    });

    // Delete the jobs
    const result = await prisma.scrapingJob.deleteMany({
      where: {
        id: {
          in: jobIds,
        },
        userId: session.user.id,
      },
    });

    return NextResponse.json({ 
      success: true, 
      deleted: result.count,
      message: `Successfully deleted ${result.count} job(s)` 
    });
  } catch (error) {
    console.error('Error deleting jobs:', error);
    return NextResponse.json(
      { error: 'Failed to delete jobs' },
      { status: 500 }
    );
  }
}
