import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total leads count
    const totalLeads = await prisma.lead.count({
      where: { userId: session.user.id },
    });

    // Get unique companies count (count distinct company names)
    const allLeads = await prisma.lead.findMany({
      where: {
        userId: session.user.id,
        companyName: { not: '' },
      },
      select: { companyName: true },
    });
    const uniqueCompanies = new Set(allLeads.map(l => l.companyName)).size;

    // Get active scraping jobs
    const activeJobs = await prisma.scrapingJob.count({
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'RUNNING'] },
      },
    });

    // Calculate weekly growth
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const leadsThisWeek = await prisma.lead.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: weekAgo },
      },
    });

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const leadsLastWeek = await prisma.lead.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: twoWeeksAgo,
          lt: weekAgo,
        },
      },
    });

    const weeklyGrowth = leadsLastWeek > 0 
      ? ((leadsThisWeek - leadsLastWeek) / leadsLastWeek) * 100 
      : 0;

    // Get active email campaigns
    const activeCampaigns = await prisma.emailCampaign.count({
      where: {
        userId: session.user.id,
        status: { in: ['SCHEDULED', 'SENDING'] },
      },
    });

    // Get total emails sent
    const totalEmailsSent = await prisma.emailEvent.count({
      where: {
        campaignId: {
          in: (await prisma.emailCampaign.findMany({
            where: { userId: session.user.id },
            select: { id: true },
          })).map(c => c.id),
        },
        eventType: 'SENT',
      },
    });

    // Get email open rate
    const emailsOpened = await prisma.emailEvent.count({
      where: {
        campaignId: {
          in: (await prisma.emailCampaign.findMany({
            where: { userId: session.user.id },
            select: { id: true },
          })).map(c => c.id),
        },
        eventType: 'OPENED',
      },
    });

    const openRate = totalEmailsSent > 0 
      ? (emailsOpened / totalEmailsSent) * 100 
      : 0;

    // Get duplicate leads count (quick estimate)
    const { findAllDuplicates } = await import('@/lib/leads/duplicate-detector');
    const duplicateGroups = await findAllDuplicates(session.user.id, 0.9);
    const duplicateLeadsCount = duplicateGroups.reduce((sum, group) => sum + group.totalMatches, 0);

    return NextResponse.json({
      totalLeads,
      totalCompanies: uniqueCompanies,
      activeJobs,
      weeklyGrowth: Math.round(weeklyGrowth * 10) / 10,
      activeCampaigns,
      totalEmailsSent,
      openRate: Math.round(openRate * 10) / 10,
      duplicateLeadsCount,
      duplicateGroupsCount: duplicateGroups.length,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
