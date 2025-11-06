import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      totalLeads,
      totalEmails,
      totalRevenue,
      activeSubscriptions,
      recentPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.lead.count(),
      prisma.emailLog.count(),
      prisma.payment.aggregate({
        where: { status: "CAPTURED" },
        _sum: { amount: true },
      }),
      prisma.subscription.count({
        where: { status: "ACTIVE" },
      }),
      prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          userId: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalLeads,
      totalEmails,
      totalRevenue: (totalRevenue._sum.amount || 0) / 100,
      activeSubscriptions,
      recentPayments,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
