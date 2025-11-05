import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignLeadId } = await params;

    // Find campaign lead
    const campaignLead = await prisma.emailCampaignLead.findUnique({
      where: { id: campaignLeadId },
      include: { lead: true, campaign: true },
    });

    if (!campaignLead) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update open tracking
    if (campaignLead.status === 'SENT') {
      await prisma.emailCampaignLead.update({
        where: { id: campaignLeadId },
        data: {
          status: 'OPENED',
          openedAt: new Date(),
        },
      });

      // Update campaign open count
      await prisma.emailCampaign.update({
        where: { id: campaignLead.campaignId },
        data: { openCount: { increment: 1 } },
      });

      // Log event
      await prisma.emailEvent.create({
        data: {
          campaignId: campaignLead.campaignId,
          leadEmail: campaignLead.lead.email || '',
          eventType: 'OPENED',
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      });

      // Update lead activity
      await prisma.leadActivity.create({
        data: {
          leadId: campaignLead.leadId,
          activityType: 'EMAIL_OPENED',
          description: `Opened email: ${campaignLead.campaign.name}`,
          metadata: { campaignId: campaignLead.campaignId },
        },
      });
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(new Uint8Array(pixel), {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error tracking email open:', error);
    
    // Return pixel even on error to avoid broken images
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    return new NextResponse(new Uint8Array(pixel), {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
      },
    });
  }
}
