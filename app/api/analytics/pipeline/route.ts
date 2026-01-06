import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get pipeline stats by stage
    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      where: { userId },
      _count: { _all: true },
      _sum: { value: true },
    });

    const pipeline = dealsByStage.map(stage => ({
      stage: stage.stage,
      count: stage._count._all,
      value: stage._sum.value || 0,
    }));

    // Get deals by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const dealsByMonth = await prisma.$queryRaw<Array<{ month: string; count: number; value: number }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COUNT(*)::int as count,
        COALESCE(SUM(value), 0)::int as value
      FROM "Deal"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `;

    // Revenue by stage
    const totalPipeline = await prisma.deal.aggregate({
      where: { userId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      _sum: { value: true },
      _count: true,
    });

    const wonDeals = await prisma.deal.aggregate({
      where: { userId, stage: 'CLOSED_WON' },
      _sum: { value: true },
      _count: true,
    });

    const lostDeals = await prisma.deal.aggregate({
      where: { userId, stage: 'CLOSED_LOST' },
      _sum: { value: true },
      _count: true,
    });

    // Weighted pipeline value (value * probability)
    const activeDeals = await prisma.deal.findMany({
      where: { userId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      select: { value: true, probability: true },
    });

    const weightedValue = activeDeals.reduce((sum, deal) => {
      return sum + (deal.value * (deal.probability / 100));
    }, 0);

    // Win rate
    const totalClosed = wonDeals._count + lostDeals._count;
    const winRate = totalClosed > 0 ? (wonDeals._count / totalClosed) * 100 : 0;

    return NextResponse.json({
      pipeline,
      dealsByMonth,
      summary: {
        totalPipelineValue: totalPipeline._sum.value || 0,
        weightedPipelineValue: Math.round(weightedValue),
        totalDeals: totalPipeline._count,
        wonDeals: wonDeals._count,
        wonValue: wonDeals._sum.value || 0,
        lostDeals: lostDeals._count,
        lostValue: lostDeals._sum.value || 0,
        winRate: Math.round(winRate),
      },
    });
  } catch (error) {
    console.error('Pipeline analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline analytics' },
      { status: 500 }
    );
  }
}
