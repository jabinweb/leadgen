import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all leads for this user
    const leads = await prisma.lead.findMany({
      where: { userId: session.user.id },
      select: { industry: true, source: true, status: true },
    });

    // Get distinct industries
    const industriesSet = new Set(leads.map(l => l.industry).filter(Boolean));
    const industries = Array.from(industriesSet).sort();

    // Get distinct sources
    const sourcesSet = new Set(leads.map(l => l.source));
    const sources = Array.from(sourcesSet).sort();

    // Count statuses
    const statusCounts: any = {};
    leads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });
    const statuses = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    return NextResponse.json({
      industries,
      sources,
      statuses,
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
