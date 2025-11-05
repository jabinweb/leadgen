import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSubscription) {
      return NextResponse.json({ 
        error: 'You already have an active subscription' 
      }, { status: 400 });
    }

    // Get free plan
    const freePlan = await prisma.plan.findUnique({
      where: { name: 'free' },
    });

    if (!freePlan) {
      return NextResponse.json({ error: 'Free plan not found' }, { status: 404 });
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Calculate period end (30 days from now)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId: freePlan.id,
        status: 'TRIALING',
        currentPeriodEnd: periodEnd,
        trialEndsAt,
      },
    });

    // Create usage tracking
    await prisma.usageTracking.create({
      data: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ 
      success: true,
      subscription,
      message: 'Free trial activated successfully' 
    });
  } catch (error: any) {
    console.error('Error activating free plan:', error);
    return NextResponse.json({ 
      error: 'Failed to activate free plan',
      details: error.message 
    }, { status: 500 });
  }
}
