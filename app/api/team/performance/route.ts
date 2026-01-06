import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Get team performance analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get team members with their performance stats
    const teamMembers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    const performance = await Promise.all(
      teamMembers.map(async (member) => {
        const [
          assignedLeadsCount,
          assignedDealsCount,
          assignedTasksCount,
          completedTasksCount,
          wonDealsCount,
          wonDealsValue,
        ] = await Promise.all([
          prisma.lead.count({
            where: { assignedToId: member.id },
          }),
          prisma.deal.count({
            where: { assignedToId: member.id },
          }),
          prisma.task.count({
            where: { assignedToId: member.id },
          }),
          prisma.task.count({
            where: {
              assignedToId: member.id,
              status: 'COMPLETED',
            },
          }),
          prisma.deal.count({
            where: {
              assignedToId: member.id,
              stage: 'CLOSED_WON',
            },
          }),
          prisma.deal.aggregate({
            where: {
              assignedToId: member.id,
              stage: 'CLOSED_WON',
            },
            _sum: {
              value: true,
            },
          }),
        ]);

        return {
          ...member,
          stats: {
            assignedLeads: assignedLeadsCount,
            assignedDeals: assignedDealsCount,
            assignedTasks: assignedTasksCount,
            completedTasks: completedTasksCount,
            wonDeals: wonDealsCount,
            wonRevenue: wonDealsValue._sum.value || 0,
            taskCompletionRate:
              assignedTasksCount > 0
                ? (completedTasksCount / assignedTasksCount) * 100
                : 0,
          },
        };
      })
    );

    // Sort by won revenue
    performance.sort((a, b) => b.stats.wonRevenue - a.stats.wonRevenue);

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Team performance fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team performance' },
      { status: 500 }
    );
  }
}
