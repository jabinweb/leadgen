import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recentJobs = await prisma.scrapingJob.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        targetWebsite: true,
        status: true,
        totalFound: true,
        progress: true,
        createdAt: true,
        configuration: true,
      },
    });

    // Format the response
    const formattedJobs = recentJobs.map(job => {
      const config = job.configuration as any;
      const name = job.name || `${job.targetWebsite} Scraping`;

      return {
        id: job.id,
        name,
        status: job.status,
        progress: job.progress || 0,
        totalFound: job.totalFound || 0,
        createdAt: job.createdAt.toISOString(),
      };
    });

    return NextResponse.json(formattedJobs);
  } catch (error) {
    console.error('Error fetching recent jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent jobs' },
      { status: 500 }
    );
  }
}
