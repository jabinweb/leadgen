import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      leadId, 
      subject, 
      body, 
      recipientEmail,
      recipientName,
      companyName 
    } = await request.json();

    if (!leadId || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a campaign for this draft
    const campaign = await prisma.emailCampaign.create({
      data: {
        name: `Draft: ${companyName || 'Lead'}`,
        subject,
        emailTemplate: body,
        fromName: session.user.name || 'Your Name',
        fromEmail: session.user.email,
        status: 'DRAFT',
        userId: session.user.id,
        totalRecipients: 1,
      },
    });

    // Link the lead to the campaign
    await prisma.emailCampaignLead.create({
      data: {
        campaignId: campaign.id,
        leadId,
        status: 'PENDING',
      },
    });

    // Log activity
    await prisma.leadActivity.create({
      data: {
        leadId,
        activityType: 'EMAIL_SENT',
        description: `Email draft created: ${subject}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ 
      campaign,
      message: 'Draft saved successfully' 
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
