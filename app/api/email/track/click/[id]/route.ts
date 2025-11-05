import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignLeadId } = await params;
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Find campaign lead
    const campaignLead = await prisma.emailCampaignLead.findUnique({
      where: { id: campaignLeadId },
      include: { lead: true },
    });

    if (campaignLead) {
      // Update click tracking
      if (campaignLead.status === 'SENT' || campaignLead.status === 'OPENED') {
        await prisma.emailCampaignLead.update({
          where: { id: campaignLeadId },
          data: {
            status: 'CLICKED',
            clickedAt: new Date(),
          },
        });

        // Update campaign click count
        await prisma.emailCampaign.update({
          where: { id: campaignLead.campaignId },
          data: { clickCount: { increment: 1 } },
        });

        // Log event
        await prisma.emailEvent.create({
          data: {
            campaignId: campaignLead.campaignId,
            leadEmail: campaignLead.lead.email || '',
            eventType: 'CLICKED',
            metadata: { url: targetUrl },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          },
        });

        // Update lead activity
        await prisma.leadActivity.create({
          data: {
            leadId: campaignLead.leadId,
            activityType: 'EMAIL_CLICKED',
            description: `Clicked link in email`,
            metadata: { campaignId: campaignLead.campaignId, url: targetUrl },
          },
        });
      }
    }

    // Redirect to the target URL
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error('Error tracking email click:', error);
    
    // Redirect to target URL even on error
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    
    if (targetUrl) {
      return NextResponse.redirect(targetUrl);
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
