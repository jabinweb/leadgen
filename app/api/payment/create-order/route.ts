import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { razorpay } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan.price === 0) {
      return NextResponse.json({ error: 'Free plan does not require payment' }, { status: 400 });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: plan.price, // amount in paise
      currency: plan.currency,
      receipt: `order_${Date.now()}`,
      notes: {
        userId: session.user.id,
        planId: plan.id,
        planName: plan.name,
      },
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'PENDING',
        razorpayOrderId: order.id,
        planId: plan.id,
        description: `Subscription to ${plan.displayName} plan`,
      },
    });

    // Get Razorpay key
    const env = process.env.RAZORPAY_ENV || 'test';
    const key = env === 'production' 
      ? process.env.RAZORPAY_LIVE_KEY_ID 
      : process.env.RAZORPAY_TEST_KEY_ID;

    return NextResponse.json({
      order,
      key,
      plan: {
        name: plan.displayName,
        price: plan.price,
      },
    });

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ 
      error: 'Failed to create order',
      details: error.message 
    }, { status: 500 });
  }
}
