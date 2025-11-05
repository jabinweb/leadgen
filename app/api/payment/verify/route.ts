import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planId 
    } = body;

    // Verify signature
    const env = process.env.RAZORPAY_ENV || 'test';
    const keySecret = env === 'production'
      ? process.env.RAZORPAY_LIVE_KEY_SECRET
      : process.env.RAZORPAY_TEST_KEY_SECRET;

    const body_data = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret!)
      .update(body_data)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        userId: session.user.id,
        razorpayOrderId: razorpay_order_id,
      },
      data: {
        status: 'CAPTURED',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Calculate period end (30 days from now for monthly)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Check if user has existing subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          trialEndsAt: null,
        },
      });
    } else {
      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId: session.user.id,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
        },
      });

      // Create usage tracking
      await prisma.usageTracking.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    // Reset usage tracking for the new billing period
    await prisma.usageTracking.update({
      where: { userId: session.user.id },
      data: {
        leadsCreated: 0,
        emailsSent: 0,
        campaignsCreated: 0,
        lastResetAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Payment verified and subscription activated' 
    });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ 
      error: 'Failed to verify payment',
      details: error.message 
    }, { status: 500 });
  }
}
