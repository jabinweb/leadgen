import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { EmailService, CampaignManager } from '@/lib/email/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    });

    if (!campaign || campaign.userId !== session.user.id) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Initialize email service
    const emailService = new EmailService({
      provider: (process.env.EMAIL_PROVIDER as any) || 'resend',
      apiKey: process.env.EMAIL_API_KEY,
    });

    const campaignManager = new CampaignManager(emailService);

    // Send campaign
    await campaignManager.sendCampaign(id);

    return NextResponse.json({ success: true, message: 'Campaign sent successfully' });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
