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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.scrapingJob.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { leads: true },
          },
        },
      }),
      prisma.scrapingJob.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching scraping jobs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const job = await prisma.scrapingJob.create({
      data: {
        name: data.name,
        targetWebsite: data.targetWebsite,
        searchQuery: data.searchQuery,
        maxResults: data.maxResults || 100,
        configuration: data.configuration,
        userId: session.user.id,
      },
    });

    // Add job to queue
    await scrapingQueue.addJob(job.id, data.configuration, session.user.id);

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating scraping job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}